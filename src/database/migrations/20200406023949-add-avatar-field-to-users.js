module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(
      'users', // Qual tabela que receberá a coluna
      'avatar_id', // Nome da coluna que será adicionada
      {
        type: Sequelize.INTEGER,
        references: { model: 'files', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        alowNull: true,
      }
    )
  },

  down: queryInterface => {
    return queryInterface.removeColunm('users', 'avatar_id')
  },
}
