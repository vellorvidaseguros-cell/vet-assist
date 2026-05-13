import { DataTypes } from 'sequelize';
import sequelize from '../database.js';
import Cliente from './Cliente.js';

const Pet = sequelize.define('Pet', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  clienteId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Cliente,
      key: 'id',
    },
  },
  nome: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  especie: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  raca: {
    type: DataTypes.STRING,
  },
  sexo: {
    type: DataTypes.STRING,
  },
  porte: {
    type: DataTypes.STRING,
  },
  idade: {
    type: DataTypes.INTEGER,
  },
  cor: {
    type: DataTypes.STRING,
  },
  microchip: {
    type: DataTypes.STRING,
    unique: true,
  },
  dataNascimento: {
    type: DataTypes.DATE,
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'Ativo',
  },
}, {
  tableName: 'pets',
  timestamps: true,
});

Cliente.hasMany(Pet, { foreignKey: 'clienteId' });
Pet.belongsTo(Cliente, { foreignKey: 'clienteId' });

export default Pet;
