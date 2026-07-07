import { DataTypes } from 'sequelize';
import sequelize from '../database.js';
import Pet from './Pet.js';
import Cliente from './Cliente.js';

// Registro imutável de cada troca de proprietário de um animal.
// Preserva o histórico completo mesmo quando o pet passa para outro cliente,
// permitindo rastrear toda a "vida" do animal dentro do app (como o histórico
// de revisões de um carro).
const TransferenciaProprietario = sequelize.define('TransferenciaProprietario', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  petId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: Pet, key: 'id' },
  },
  veterinarioId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  clienteAnteriorId: {
    type: DataTypes.INTEGER,
    allowNull: true, // null = primeiro cadastro do animal (sem dono anterior)
    references: { model: Cliente, key: 'id' },
  },
  clienteNovoId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: Cliente, key: 'id' },
  },
  motivo: {
    type: DataTypes.STRING,
  },
  dataTransferencia: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'transferencias_proprietario',
  timestamps: true,
});

Pet.hasMany(TransferenciaProprietario, { foreignKey: 'petId', as: 'HistoricoProprietarios' });
TransferenciaProprietario.belongsTo(Pet, { foreignKey: 'petId' });

TransferenciaProprietario.belongsTo(Cliente, { foreignKey: 'clienteAnteriorId', as: 'ClienteAnterior' });
TransferenciaProprietario.belongsTo(Cliente, { foreignKey: 'clienteNovoId', as: 'ClienteNovo' });

export default TransferenciaProprietario;
