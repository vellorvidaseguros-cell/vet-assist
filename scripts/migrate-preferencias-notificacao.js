// Migração: adiciona coluna preferenciasNotificacao (JSON) em veterinarios.
// Executar com o backend PARADO: node scripts/migrate-preferencias-notificacao.js
import { DataTypes } from 'sequelize'
import sequelize from '../backend/database.js'

async function migrar() {
  const qi = sequelize.getQueryInterface()

  const desc = await qi.describeTable('veterinarios')
  if (!desc.preferenciasNotificacao) {
    await qi.addColumn('veterinarios', 'preferenciasNotificacao', {
      type: DataTypes.TEXT,
      allowNull: true,
    })
    console.log('[OK] Coluna preferenciasNotificacao adicionada em veterinarios')
  } else {
    console.log('[SKIP] veterinarios já tem preferenciasNotificacao')
  }

  await sequelize.close()
  console.log('[OK] Migração concluída!')
}

migrar().catch(err => {
  console.error('[ERRO] Migração falhou:', err.message)
  process.exit(1)
})
