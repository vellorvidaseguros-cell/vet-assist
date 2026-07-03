import { DataTypes } from 'sequelize';
import sequelize from '../database.js';

const Veterinario = sequelize.define('Veterinario', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nome: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  senha: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  telefone: {
    type: DataTypes.STRING,
  },
  cpf: {
    type: DataTypes.STRING,
    unique: true,
  },
  crmv: {
    type: DataTypes.STRING,
    unique: true,
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  // Papel da conta: 'admin' (dono do app) ou 'vet' (assinante)
  role: {
    type: DataTypes.STRING,
    defaultValue: 'vet',
  },
  // Plano contratado: 'basico' | 'plus' | 'max' (presets em config/planos.js)
  plano: {
    type: DataTypes.STRING,
    defaultValue: 'basico',
  },
  // Permissões customizadas pelo admin (array de chaves de recurso).
  // NULL/vazio = usa o preset do plano.
  permissoes: {
    type: DataTypes.TEXT,
    defaultValue: null,
    get() {
      const value = this.getDataValue('permissoes')
      if (!value) return null
      if (typeof value === 'string') {
        try {
          return JSON.parse(value)
        } catch (e) {
          return null
        }
      }
      return value
    },
    set(value) {
      if (value && typeof value === 'object') {
        this.setDataValue('permissoes', JSON.stringify(value))
      } else {
        this.setDataValue('permissoes', value)
      }
    }
  },
  dataNascimento: DataTypes.DATE,
  genero: DataTypes.STRING,
  endereco: DataTypes.TEXT,
  cidade: DataTypes.STRING,
  estado: DataTypes.STRING,
  nomeClinica: DataTypes.STRING,
  cnpj: DataTypes.STRING,
  especialidade: DataTypes.STRING,
  fotoPerfil: DataTypes.TEXT,
  logomarcaUrl: DataTypes.TEXT,
  tabelaPrecos: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Valores customizados para tipos de atendimento'
  },
  whiteLabel: {
    type: DataTypes.TEXT, // Usar TEXT em vez de JSON para melhor compatibilidade com SQLite
    defaultValue: null,
    comment: 'Dados de white label para customização de PDFs',
    get() {
      const value = this.getDataValue('whiteLabel')
      if (!value) return null
      if (typeof value === 'string') {
        try {
          return JSON.parse(value)
        } catch (e) {
          console.error('[ERROR] Erro ao parsear whiteLabel:', e)
          return null
        }
      }
      return value
    },
    set(value) {
      if (value && typeof value === 'object') {
        this.setDataValue('whiteLabel', JSON.stringify(value))
      } else {
        this.setDataValue('whiteLabel', value)
      }
    }
  },
}, {
  tableName: 'veterinarios',
  timestamps: true,
});

export default Veterinario;
