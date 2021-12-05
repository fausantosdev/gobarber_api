import jwt from 'jsonwebtoken'

// import * as Yup from 'yup'

import User from '../models/User'

import authConfig from '../../config/auth'

class SessionController {
  async store(req, res) {
    const { email, password } = req.body

    /* const schema = Yup.object().shape({
      email: Yup.string()
        .email()
        .required(),
      password: Yup.string().required(),
    })

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' })
    } */

    const user = await User.findOne({ where: { email } })

    if (!user) {
      // 401 = Status de não autorizado.
      return res.status(401).json({ error: 'User not found' })
    }

    if (!(await user.checkPassword(password))) {
      // bcript.compare é assincrono.
      return res.status(401).json({ error: 'Password does not match' })
    }

    const { id, name } = user

    return res.json({
      user: {
        id,
        name,
        email,
      }, // token = informações a serem enviadas, chave secreta, configurações
      token: jwt.sign({ id }, authConfig.secret, {
        // Paiload, informações adicionais a serem enviadas no token.
        expiresIn: authConfig.expiresIn,
      }),
    })
  }
}

export default new SessionController()
