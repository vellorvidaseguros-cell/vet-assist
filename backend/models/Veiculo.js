import { DataTypes } from 'sequelize'
import sequelize from '../database.js'

const Veiculo = sequelize.define('Veiculo', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  veterinarioId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  placa: {
    type: DataTypes.STRING,
    unique: true,
  },
  marca: DataTypes.STRING,
  modelo: DataTypes.STRING,
  ano: DataTypes.INTEGER,
  kmAtual: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  consumoMedio: {
    type: DataTypes.DECIMAL(5, 2),
    comment: 'KM/L'
  },
  combustivel: {
    type: DataTypes.STRING,
    defaultValue: 'Gasolina',
  },
  valorSeguroMensal: DataTypes.DECIMAL(10, 2),
  valorIPVAAnual: DataTypes.DECIMAL(10, 2),
  custoManutencaoEstimado: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  dataAquisicao: DataTypes.DATE,
  valorAquisicao: DataTypes.DECIMAL(15, 2),
}, {
  tableName: 'veiculos',
  timestamps: true,
})

export default Veiculo
