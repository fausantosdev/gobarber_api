import * as Yup from 'yup'

import User from '../models/User'

class UserController {
  async store(req, res) {
    const schema = Yup.object().shape({
      // Validando um objeto, posi o req.body é um objeto.
      name: Yup.string().required(),
      email: Yup.string()
        .email() // Valida o email
        .required(),
      password: Yup.string()
        .min(6)
        .required(),
    })

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' })
    }

    const userExists = await User.findOne({ where: { email: req.body.email } })

    if (userExists) {
      return res.status(400).json({ error: 'User email already exists.' })
    }

    const { id, name, email, provider } = await User.create(req.body)

    return res.json({
      id,
      name,
      email,
      provider,
    })
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      // Validando um objeto, posi o req.body é um objeto.
      name: Yup.string(),
      email: Yup.string().email(),
      oldPassword: Yup.string().min(6),
      password: Yup.string()
        .min(6)
        .when('oldPassword', (
          oldPassword,
          field // Quando for preenchida, seje obrigatória
        ) => (oldPassword ? field.required() : field)),
      confirmPassword: Yup.string().when('password', (password, field) =>
        password ? field.required().oneOf([Yup.ref('password')]) : field
      ),
    })

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' })
    }

    // Só será acessível a usuários logados.
    const { email, oldPassword } = req.body

    const user = await User.findByPk(req.userId) // Id que vem do req adicionado na autenticação.

    if (email && email !== user.email) {
      // Caso for atualizar o email.
      const userExists = await User.findOne({ where: { email } })

      if (userExists) {
        return res.status(400).json({ error: 'Email already exists' })
      }
    }

    // Se informou a senha antiga.
    if (oldPassword && !(await user.checkPassword(oldPassword))) {
      return res.status(401).json({ error: 'Password does not match' })
    }

    const { id, name, provider } = await user.update(req.body)

    // console.log(req.userId)

    return res.json({
      id,
      name,
      email,
      provider,
    })
  }
}

export default new UserController()
