import 'dotenv/config'
import express from 'express'
import 'express-async-errors' // Depois do express* e antes das rotas*
import morgan from 'morgan'
import path from 'path'
import * as Sentry from '@sentry/node'
import Youch from 'youch'
import sentryConfig from './config/sentry'

import routes from './routes'

import './database'

class App {
  constructor() {
    this.server = express()

    Sentry.init(sentryConfig)

    // Chamada dos métodos
    this.middlewares()
    this.routes()

    this.exceptionHandler()
  }

  // Métodos - todos os middlewares da aplicação
  middlewares() {
    // O manipulador de solicitações deve ser o primeiro middleware no aplicativo.
    this.server.use(Sentry.Handlers.requestHandler())

    this.server.use(express.json())
    this.server.use(morgan('dev'))
    this.server.use(
      '/files',
      express.static(path.resolve(__dirname, '..', 'tmp', 'uploads'))
    )
  }

  routes() {
    this.server.use(routes)

    // O manipulador de erros deve estar antes de qualquer outro middleware de erro e depois de todos os controladores(no nosso caso ficará depois das rotas, já que elas chamam os controlelrs)
    this.server.use(Sentry.Handlers.errorHandler())
  }

  exceptionHandler() {
    // Middleware de tratamento de exceção.
    this.server.use(async (err, req, res, next) => {
      if (process.enc.NODE_ENV === 'development') {
        const errors = await new Youch(err, req).toJSON()

        return res.status(500).json(errors)
      }

      return res.status(500).json({ error: 'Internal server error' })
    })
  }
}
export default new App().server
