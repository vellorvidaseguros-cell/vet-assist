import { DataTypes } from 'sequelize'
import sequelize from '../database.js'

// Registro de um documento (orçamento/cobrança) emitido pelo veterinário.
// Guarda os dados completos (JSON) para permitir re-gerar o PDF depois e
// mantém a data de emissão para consulta posterior.
const DocumentoEmitido = sequelize.define('DocumentoEmitido', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  veterinarioId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  tipo: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'orcamento', // 'orcamento' | 'cobranca'
  },
  numero: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  clienteNome: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  petNome: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  // Payload completo usado para re-gerar o PDF (procedimentos, observação, etc.)
  dados: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const raw = this.getDataValue('dados')
      if (!raw) return null
      try { return JSON.parse(raw) } catch { return null }
    },
    set(value) {
      this.setDataValue('dados', value ? JSON.stringify(value) : null)
    }
  },
}, {
  tableName: 'documentos_emitidos',
  timestamps: true,
  paranoid: true,
})

export default DocumentoEmitido
