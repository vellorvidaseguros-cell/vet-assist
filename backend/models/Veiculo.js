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
    comment: 'Odômetro do veículo (informativo, NÃO usado no cálculo de custo)'
  },
  kmMensal: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: 'Km rodados por mês A TRABALHO — base do cálculo de custo/km'
  },
  consumoMedio: {
    type: DataTypes.DECIMAL(5, 2),
    comment: 'KM/L'
  },
  combustivel: {
    type: DataTypes.STRING,
    defaultValue: 'Gasolina',
  },
  precoCombustivel: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    comment: 'Preço do litro definido pelo veterinário (null = usar média de mercado)'
  },
  percentualUsoProfissional: {
    type: DataTypes.INTEGER,
    defaultValue: 100,
    comment: '% do uso do veículo que é profissional (rateia custos fixos)'
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
