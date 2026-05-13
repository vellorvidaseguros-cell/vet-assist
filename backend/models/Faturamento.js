import { DataTypes } from 'sequelize'
import sequelize from '../database.js'

const Faturamento = sequelize.define('Faturamento', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  historicoConsultaId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  clienteId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  valor: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  valorRecebido: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'Pendente',
  },
  dataEmissao: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  dataPagamento: DataTypes.DATE,
  dataUltimoPagamento: DataTypes.DATE,
  descricao: DataTypes.TEXT,
  numeroNota: DataTypes.STRING,
  historicoPagamentos: {
    type: DataTypes.TEXT,  // Usar TEXT em vez de JSON para SQLite
    defaultValue: '[]',
    comment: 'Array de pagamentos: [{ data, valor }]',
    get() {
      const value = this.getDataValue('historicoPagamentos')
      return typeof value === 'string' ? JSON.parse(value || '[]') : (value || [])
    },
    set(value) {
      this.setDataValue('historicoPagamentos', typeof value === 'string' ? value : JSON.stringify(value || []))
    }
  }
}, {
  tableName: 'faturamentos',
  timestamps: true,
})

export default Faturamento
