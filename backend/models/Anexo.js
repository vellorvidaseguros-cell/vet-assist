import { DataTypes } from 'sequelize'
import sequelize from '../database.js'

const Anexo = sequelize.define('Anexo', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  agendamentoId: {
    // Opcional: um anexo pode estar vinculado só a um histórico (ex: atendimento
    // registrado direto no diário compartilhado, sem passar por um Agendamento)
    type: DataTypes.INTEGER,
    allowNull: true,
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
