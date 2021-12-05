import Sequelize from 'sequelize'
import mongoose from 'mongoose'

import databaseConfig from '../config/database'

import User from '../app/models/User'
import File from '../app/models/File'
import Appointment from '../app/models/Appointment'

const models = [User, File, Appointment]

class Database {
  constructor() {
    this.init()
    this.mongo()
  }

  // ↓ Faz a conexão e carrega os models.
  init() {
    this.connection = new Sequelize(databaseConfig)

    this.connection
      .authenticate()
      .then(() => {
        console.log('--- Connection has been established successfully.')
      })
      .catch(err => {
        console.error('--- Unable to connect to the database:', err)
      })

    models
      .map(model => model.init(this.connection))
      .map(model => model.associate && model.associate(this.connection.models))
  }

  mongo() {
    this.mongoConnection = mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useFindAndModify: true,
      useUnifiedTopology: true,
    })

    const db = mongoose.connection

    db.on('error', console.error.bind(console, 'connection error:'))
    db.once('open', function() {
      console.log('--- Mongo connected...')
    })
  }
}

export default new Database()
