// Migração: cria a tabela documentos_emitidos (histórico de orçamentos/cobranças)
// Executar com o backend PARADO: node scripts/migrate-documentos.js
import { DataTypes } from 'sequelize'
import sequelize from '../backend/database.js'

async function migrar() {
  const qi = sequelize.getQueryInterface()
  const tabelas = await qi.showAllTables()

  if (!tabelas.includes('documentos_emitidos')) {
    await qi.createTable('documentos_emitidos', {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      veterinarioId: { type: DataTypes.INTEGER, allowNull: false },
      tipo: { type: DataTypes.STRING, allowNull: false, defaultValue: 'orcamento' },
      numero: { type: DataTypes.STRING, allowNull: true },
      clienteNome: { type: DataTypes.STRING, allowNull: true },
      petNome: { type: DataTypes.STRING, allowNull: true },
      total: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
      dados: { type: DataTypes.TEXT, allowNull: true },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false },
      deletedAt: { type: DataTypes.DATE, allowNull: true },
    })
    console.log('[OK] Tabela documentos_emitidos criada')
  } else {
    console.log('[SKIP] Tabela documentos_emitidos já existe')
  }

  await sequelize.close()
  console.log('[OK] Migração concluída!')
}

migrar().catch(err => {
  console.error('[ERRO] Migração falhou:', err.message)
  process.exit(1)
})
