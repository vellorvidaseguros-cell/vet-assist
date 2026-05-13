import { DataTypes } from 'sequelize';
import sequelize from '../database.js';
import Pet from './Pet.js';
import Cliente from './Cliente.js';

const Consulta = sequelize.define('Consulta', {
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
  clienteId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Cliente,
      key: 'id',
    },
  },
  data: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  tipoAtendimento: {
    type: DataTypes.STRING,
    defaultValue: 'Consulta',
  },
  diagnostico: {
    type: DataTypes.TEXT,
  },
  procedimentos: {
    type: DataTypes.TEXT,
  },
  proximoRetorno: {
    type: DataTypes.DATE,
  },
  veterinario: {
    type: DataTypes.STRING,
  },
  valor: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  statusPagamento: {
    type: DataTypes.STRING,
    defaultValue: 'Pendente',
  },
  observacoes: {
    type: DataTypes.TEXT,
  },
}, {
  tableName: 'consultas',
  timestamps: true,
});

Pet.hasMany(Consulta, { foreignKey: 'petId' });
Consulta.belongsTo(Pet, { foreignKey: 'petId' });

Cliente.hasMany(Consulta, { foreignKey: 'clienteId' });
Consulta.belongsTo(Cliente, { foreignKey: 'clienteId' });

export default Consulta;
