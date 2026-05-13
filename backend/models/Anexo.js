import { DataTypes } from 'sequelize'
import sequelize from '../database.js'

const Anexo = sequelize.define('Anexo', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  agendamentoId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  historicoConsultaId: {
    type: DataTypes.INTEGER,
  },
  nomeArquivo: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  caminhoArquivo: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  tipoMidia: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  descricao: DataTypes.STRING,
}, {
  tableName: 'anexos',
  timestamps: true,
})

export default Anexo
