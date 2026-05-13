import { DataTypes } from 'sequelize';
import sequelize from '../database.js';
import Pet from './Pet.js';

const Vacina = sequelize.define('Vacina', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  petId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Pet,
      key: 'id',
    },
  },
  vacina: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  dataAplicacao: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  proximaDose: {
    type: DataTypes.DATE,
  },
  fabricante: {
    type: DataTypes.STRING,
  },
  lote: {
    type: DataTypes.STRING,
  },
  veterinario: {
    type: DataTypes.STRING,
  },
  observacoes: {
    type: DataTypes.TEXT,
  },
}, {
  tableName: 'vacinas',
  timestamps: true,
});

Pet.hasMany(Vacina, { foreignKey: 'petId' });
Vacina.belongsTo(Pet, { foreignKey: 'petId' });

export default Vacina;
