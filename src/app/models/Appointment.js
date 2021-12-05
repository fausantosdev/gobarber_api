import Sequelize, { Model } from 'sequelize'
import { isBefore, subHours } from 'date-fns'

class Appointment extends Model {
  static init(sequelize) {
    super.init(
      {
        date: Sequelize.DATE,
        canceled_at: Sequelize.DATE,
        past: {
          type: Sequelize.VIRTUAL,
          get() {
            // Retorna true caso já tenha passado.
            return isBefore(this.date, new Date())
          },
        },
        cancelable: {
          // Se é cancelável ou não
          type: Sequelize.VIRTUAL,
          get() {
            return isBefore(new Date(), subHours(this.date, 2))
          },
        },
      },
      {
        sequelize,
      }
    )
    return this
  }

  static associate(models) {
    this.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' }) // Mais de um relacionamento torna-se obrigatório o uso do as*
    this.belongsTo(models.User, { foreignKey: 'provider_id', as: 'provider' })
  }
}

export default Appointment
