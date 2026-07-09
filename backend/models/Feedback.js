import { DataTypes } from 'sequelize'
import sequelize from '../database.js'

// Dúvidas/sugestões/bugs enviados pelos veterinários, revisados pelo admin do app.
const Feedback = sequelize.define('Feedback', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  veterinarioId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  tipo: {
    type: DataTypes.STRING, // 'duvida' | 'sugestao' | 'bug'
    defaultValue: 'sugestao',
  },
  mensagem: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING, // 'novo' | 'lido' | 'resolvido'
    defaultValue: 'novo',
  },
}, {
  tableName: 'feedbacks',
  timestamps: true,
})

export default Feedback
