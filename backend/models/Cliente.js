import { DataTypes } from 'sequelize';
import sequelize from '../database.js';
import Veterinario from './Veterinario.js';

const Cliente = sequelize.define('Cliente', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  veterinarioId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Veterinario,
      key: 'id',
    },
  },
  nome: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  telefone: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
  },
  cpf: {
    type: DataTypes.STRING,
    unique: true,
  },
  endereco: {
    type: DataTypes.STRING,
  },
  cidade: {
    type: DataTypes.STRING,
  },
  estado: {
    type: DataTypes.STRING,
  },
  dataUltimaConsulta: {
    type: DataTypes.DATE,
  },
}, {
  tableName: 'clientes',
  timestamps: true,
});

Veterinario.hasMany(Cliente, { foreignKey: 'veterinarioId' });
Cliente.belongsTo(Veterinario, { foreignKey: 'veterinarioId' });

export default Cliente;
