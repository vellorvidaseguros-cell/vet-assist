import { DataTypes } from 'sequelize'
import sequelize from '../database.js'

const Despesa = sequelize.define('Despesa', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  veterinarioId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  categoriaDespesa: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  descricao: {
    type: DataTypes.TEXT,
  },
  valor: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  data: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  tipo: {
    type: DataTypes.STRING,
    defaultValue: 'Gasto',
    comment: 'Gasto, Investimento, Outro'
  },
  comprovante: DataTypes.TEXT,
}, {
  tableName: 'despesas',
  timestamps: true,
  paranoid: true,
})

export default Despesa
