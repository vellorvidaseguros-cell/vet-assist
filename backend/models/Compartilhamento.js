import { DataTypes } from 'sequelize'
import sequelize from '../database.js'

const Compartilhamento = sequelize.define('Compartilhamento', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  animalId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  veterinarioOrigemId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'VetA — quem está compartilhando'
  },
  veterinarioConvidadoId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'VetB — quem foi convidado. Null enquanto pendente.'
  },
  emailConvidado: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Email de VetB se ele ainda não tem conta'
  },
  permissoes: {
    type: DataTypes.JSON,
    defaultValue: ['ver'],
    comment: 'Array de permissões: ["ver", "editar"]'
  },
  token: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
    comment: 'Token único para aceitar convite via link público'
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'pendente',
    comment: 'pendente | aceito | rejeitado'
  },
  aceitoEm: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Quando VetB aceitou o convite'
  },
}, {
  tableName: 'compartilhamentos',
  timestamps: true,
})

export default Compartilhamento
