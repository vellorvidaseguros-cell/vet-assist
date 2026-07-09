// Migração: cria a tabela feedbacks (dúvidas/sugestões/bugs enviados pelos veterinários).
// Executar com o backend PARADO: node scripts/migrate-feedback.js
import sequelize from '../backend/database.js'
import '../backend/models/Feedback.js' // registra o modelo no sequelize antes do sync

async function migrar() {
  await sequelize.sync({ force: false }) // cria só as tabelas que faltam (feedbacks é nova)
  console.log('[OK] Tabela feedbacks garantida (criada se não existia)')
  await sequelize.close()
  console.log('[OK] Migração concluída!')
}

migrar().catch(err => {
  console.error('[ERRO] Migração falhou:', err.message)
  process.exit(1)
})
