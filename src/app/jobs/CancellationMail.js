import { format, parseISO } from 'date-fns'
import pt from 'date-fns/locale/pt'

import Mail from '../../lib/Mail'

class CancelationMail {
  get key() {
    return 'CancellationMail' // Chave única que identificará o job.
  }

  async handle({ data }) {
    // A tarefa que vai executar quando esse processo for executado.
    const { appointment } = data

    console.log('--- A fila executou!')

    await Mail.senddMail({
      to: `${appointment.provider.name} <${appointment.provider.eMail}>`,
      subject: 'Agendamento cancelado',
      /* text: 'Você tem um novo cancelamento', */
      template: 'cancelation',
      context: {
        provider: appointment.provider.name,
        user: appointment.user.name,
        date: format(
          parseISO(appointment.date),
          "'dia' dd 'de' MMMM', às' H:mm'h'",
          {
            locale: pt,
          }
        ),
      },
    })
  }
}

export default new CancelationMail()
