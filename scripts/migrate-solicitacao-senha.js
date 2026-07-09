// Migração: cria a tabela solicitacoes_senha (pedidos de redefinição de senha
// mediados pelo admin). Executar com o backend PARADO: node scripts/migrate-solicitacao-senha.js
import sequelize from '../backend/database.js'
import '../backend/models/SolicitacaoSenha.js' // registra o modelo no sequelize antes do sync

async function migrar() {
  await sequelize.sync({ force: false })
  console.log('[OK] Tabela solicitacoes_senha garantida (criada se não existia)')
  await sequelize.close()
  console.log('[OK] Migração concluída!')
}

migrar().catch(err => {
  console.error('[ERRO] Migração falhou:', err.message)
  process.exit(1)
})
