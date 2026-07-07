import { DataTypes } from 'sequelize';
import sequelize from '../database.js';
import Pet from './Pet.js';
import Cliente from './Cliente.js';

const Agendamento = sequelize.define('Agendamento', {
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
  hora: {
    type: DataTypes.TIME,
    allowNull: true,
  },
  tipoAtendimento: {
    type: DataTypes.STRING,
    defaultValue: 'Consulta',
  },
  descricao: {
    type: DataTypes.TEXT,
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'Pendente',
  },
  observacoes: {
    type: DataTypes.TEXT,
  },
  valor: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  diagnostico: {
    type: DataTypes.TEXT,
    defaultValue: '',
  },
  procedimentos: {
    type: DataTypes.TEXT,
    defaultValue: '',
  },
  medicamentos: {
    type: DataTypes.TEXT,
    defaultValue: '',
  },
  proximoRetorno: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'agendamentos',
  timestamps: true,
  paranoid: true,
});

Pet.hasMany(Agendamento, { foreignKey: 'petId' });
Agendamento.belongsTo(Pet, { foreignKey: 'petId' });

Cliente.hasMany(Agendamento, { foreignKey: 'clienteId' });
Agendamento.belongsTo(Cliente, { foreignKey: 'clienteId' });

export default Agendamento;
