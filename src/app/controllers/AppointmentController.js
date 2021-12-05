import * as Yup from 'yup'
import { startOfHour, parseISO, isBefore, format, subHours } from 'date-fns'
import pt from 'date-fns/locale/pt'
import Appointment from '../models/Appointment'

import User from '../models/User'
import File from '../models/File'

import Notification from '../schemas/Notification'

import Queue from '../../lib/Queue'
import CancelationMail from '../jobs/CancellationMail'

class AppointmentController {
  async index(req, res) {
    const { page = 1 } = req.query

    const appointments = await Appointment.findAll({
      where: { user_id: req.userId, canceled_at: null },
      order: ['date'],
      limit: 20,
      offset: (page - 1) * 20,
      attributes: ['id', 'date', 'past', 'cancelable'],
      include: [
        {
          model: User,
          as: 'provider',
          attributes: ['id', 'name'],
          include: {
            model: File,
            as: 'avatar',
            attributes: ['id', 'path', 'url'],
          },
        },
      ],
    })

    return res.json(appointments)
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      date: Yup.date().required(),
      provider_id: Yup.number().required(),
    })

    if (!(await schema.isValid(req.body))) {
      res.status(400).json({ erro: 'Validation fails' })
    }

    const { provider_id, date } = req.body

    // Verifica se o provider_id é realmente um provider
    const isProvider = await User.findOne({
      where: { id: provider_id, provider: true },
    })

    if (!isProvider) {
      return res
        .status(401)
        .json({ erro: 'You can only create appointment with providers' })
    }

    if (isProvider.id === req.userId) {
      return res
        .status(401)
        .json({ erro: 'You cannot make an appointment with yourself' })
    }

    const hourStart = startOfHour(parseISO(date)) // parseISO transforma a data enviada em um formato date do javascript e o startOfHour pega o início da hora.

    if (isBefore(hourStart, new Date())) {
      // Verifica se é uma data futura.
      return res.status(401).json({ erro: 'Past date are not permitted' })
    }

    // Verifica se ja´não tem um agendamento marcado para o mesmo horário.
    const checkAvailability = await Appointment.findOne({
      where: {
        provider_id,
        canceled_at: null, // Se não foi cancelado.
        date: hourStart,
      },
    })

    if (checkAvailability) {
      return res.status(401).json({ erro: 'Appointment date is not available' })
    }

    const appointment = await Appointment.create({
      user_id: req.userId,
      provider_id,
      date: hourStart, // Garante que nenhum agendamento seja criado em horas quebradas.
    })

    const user = await User.findByPk(req.userId)

    const formattedDate = format(
      hourStart,
      "'dia' dd 'de' MMMM', às' H:mm'h'",
      {
        locale: pt,
      }
    )

    // Notificar prestador de serviço
    await Notification.create({
      content: `Novo agendamento de ${user.name} para dia ${formattedDate}`,
      user: provider_id,
    })

    return res.json(appointment)
  }

  async delete(req, res) {
    const appointment = await Appointment.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'provider',
          attributes: ['name', 'email'],
        },
        {
          model: User,
          as: 'user',
          attributes: ['name'],
        },
      ],
    })

    if (appointment.user_id !== req.userId) {
      return res
        .status(401)
        .json({ error: "You don't have permission to cancel this appointment" })
    }

    const dateWithSub = subHours(appointment.date, 2)

    if (isBefore(dateWithSub, new Date())) {
      // Verifica se é antes da hora atual, menos de 2 horas de distância, não cancela.
      return res
        .status(401)
        .json({ error: 'You can only cancel appointments 2 hours is advanecd' })
    }

    appointment.canceled_at = new Date()

    await appointment.save()

    // sendmail
    await Queue.add(CancelationMail.key, { appointment })

    return res.json(appointment)
  }
}

export default new AppointmentController()
