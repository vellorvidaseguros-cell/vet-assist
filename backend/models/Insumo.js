import { DataTypes } from 'sequelize'
import sequelize from '../database.js'

const Insumo = sequelize.define('Insumo', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  veterinarioId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  nome: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  unidade: {
    type: DataTypes.STRING,
    defaultValue: 'un',
    comment: 'un, ml, mg, comprimido, frasco, etc'
  },
  quantidadeEstoque: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  quantidadeMinima: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: 'Alerta de estoque baixo quando quantidadeEstoque <= quantidadeMinima'
  },
  custoUnitario: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: 'Quanto custou comprar (referência interna, não aparece no orçamento)'
  },
  precoVenda: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: 'Valor cobrado do cliente por unidade ao usar no atendimento'
  },
}, {
  tableName: 'insumos',
  timestamps: true,
  paranoid: true,
})

export default Insumo
