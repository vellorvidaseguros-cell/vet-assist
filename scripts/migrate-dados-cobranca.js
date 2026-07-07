// Migração: adiciona coluna dadosCobranca (dados bancários/Pix) em veterinarios.
// Executar com o backend PARADO: node scripts/migrate-dados-cobranca.js
import { DataTypes } from 'sequelize'
import sequelize from '../backend/database.js'

async function migrar() {
  const qi = sequelize.getQueryInterface()

  const desc = await qi.describeTable('veterinarios')
  if (!desc.dadosCobranca) {
    await qi.addColumn('veterinarios', 'dadosCobranca', {
      type: DataTypes.TEXT,
      allowNull: true,
    })
    console.log('[OK] Coluna dadosCobranca adicionada em veterinarios')
  } else {
    console.log('[SKIP] veterinarios já tem dadosCobranca')
  }

  await sequelize.close()
  console.log('[OK] Migração concluída!')
}

migrar().catch(err => {
  console.error('[ERRO] Migração falhou:', err.message)
  process.exit(1)
})
