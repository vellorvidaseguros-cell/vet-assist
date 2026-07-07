// Migração: torna anexos.agendamentoId opcional (permite anexo vinculado só a um
// histórico, sem passar por um Agendamento — usado no diário de atendimento compartilhado).
// Executar com o backend PARADO: node scripts/migrate-anexo-agendamento-opcional.js
import { DataTypes } from 'sequelize'
import sequelize from '../backend/database.js'

async function migrar() {
  const qi = sequelize.getQueryInterface()

  await qi.changeColumn('anexos', 'agendamentoId', {
    type: DataTypes.INTEGER,
    allowNull: true,
  })
  console.log('[OK] anexos.agendamentoId agora aceita NULL')

  await sequelize.close()
  console.log('[OK] Migração concluída!')
}

migrar().catch(err => {
  console.error('[ERRO] Migração falhou:', err.message)
  process.exit(1)
})
