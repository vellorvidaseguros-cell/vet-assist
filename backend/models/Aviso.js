import { DataTypes } from 'sequelize'
import sequelize from '../database.js'

// Avisos/atualizações enviados pelo admin do app pra todos os veterinários
// (ex: "adicionamos tal melhoria"). Aparece como notificação no ícone de
// Dúvidas e Sugestões de todo mundo.
const Aviso = sequelize.define('Aviso', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  autorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  mensagem: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
}, {
  tableName: 'avisos',
  timestamps: true,
})

export default Aviso
