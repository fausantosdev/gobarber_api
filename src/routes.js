import { Router } from 'express'
import multer from 'multer'
import multerConfig from './config/multer'

import UserController from './app/controllers/UserController'
import SessionController from './app/controllers/SessionController'
import FileController from './app/controllers/FileController'
import ProviderController from './app/controllers/ProviderController'
import AppointmentController from './app/controllers/AppointmentController'
import ScheduleController from './app/controllers/ScheduleController'
import NotificationController from './app/controllers/NotificationController'
import AvailableController from './app/controllers/AvailableController'

import authMiddleware from './app/middlewares/auth'

const routes = new Router()

const upload = multer(multerConfig)

routes.get('/', async (req, res) => {
  return res.json({ teste: 'teste' })
})

routes.post('/user', UserController.store)
routes.post('/session', SessionController.store)

routes.use(authMiddleware) // Middleware global, funcionará em todas as rotas abaixo.

routes.put('/user', UserController.update)
routes.get('/providers', ProviderController.index)
routes.post('/files', upload.single('file'), FileController.store)

routes.get('/appointment', AppointmentController.index)
routes.post('/appointment', AppointmentController.store)
routes.delete('/appointment/:id', AppointmentController.delete)
routes.get('/appointment/:providerId/availabe', AvailableController.index)

routes.get('/schedule', ScheduleController.index)

routes.get('/notification', NotificationController.index)
routes.put('/notification', NotificationController.update)

export default routes
