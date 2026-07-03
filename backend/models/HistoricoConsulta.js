import { DataTypes } from 'sequelize'
import sequelize from '../database.js'

const HistoricoConsulta = sequelize.define('HistoricoConsulta', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  petId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  clienteId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  // Multi-tenancy: dono dos dados. allowNull para compatibilidade com
  // registros antigos (backfill via scripts/migrate-multitenancy.js)
  veterinarioId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  data: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  tipoAtendimento: DataTypes.STRING,
  diagnostico: DataTypes.TEXT,
  procedimentos: DataTypes.TEXT,
  medicamentos: DataTypes.TEXT,
  observacoes: DataTypes.TEXT,
  proximoRetorno: DataTypes.DATE,
  veterinario: DataTypes.STRING,
  valor: DataTypes.DECIMAL(10, 2),
  statusPagamento: {
    type: DataTypes.STRING,
    defaultValue: 'Pendente',
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'Concluído',
    comment: 'Status da consulta: Concluído, Pendente, Cancelado, Reagendado'
  },
}, {
  tableName: 'historico_consultas',
  timestamps: true,
})

export default HistoricoConsulta
