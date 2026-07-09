import { DataTypes } from 'sequelize'
import sequelize from '../database.js'

// Pedido de redefinição de senha: o vet solicita, mas só o admin gera o
// código e o entrega manualmente (WhatsApp/telefone), verificando a
// identidade da pessoa antes — mais seguro que o link automático anterior.
const SolicitacaoSenha = sequelize.define('SolicitacaoSenha', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  veterinarioId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING, // 'pendente' | 'token_gerado' | 'concluido'
    defaultValue: 'pendente',
  },
  tokenGeradoEm: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'solicitacoes_senha',
  timestamps: true,
})

export default SolicitacaoSenha
