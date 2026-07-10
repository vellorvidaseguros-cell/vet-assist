// Migração: adiciona a coluna dataVencimento na tabela faturamentos (SQLite dev / Postgres prod).
// Executar com o backend PARADO: node scripts/migrate-vencimento-cobranca.js
import sequelize from '../backend/database.js'

async function migrar() {
  try {
    await sequelize.query('ALTER TABLE faturamentos ADD COLUMN "dataVencimento" DATE')
    console.log('[OK] Coluna dataVencimento adicionada em faturamentos')
  } catch (err) {
    if (/duplicate column|already exists/i.test(err.message)) {
      console.log('[OK] Coluna dataVencimento já existia, nada a fazer')
    } else {
      throw err
    }
  }
  await sequelize.close()
  console.log('[OK] Migração concluída!')
}

migrar().catch(err => {
  console.error('[ERRO] Migração falhou:', err.message)
  process.exit(1)
})
