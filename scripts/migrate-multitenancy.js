// Migração multi-tenancy: adiciona veterinarioId às tabelas de dados
// e atribui todos os registros existentes ao veterinário admin.
// Executar com o backend PARADO: node scripts/migrate-multitenancy.js
import { DataTypes } from 'sequelize'
import sequelize from '../backend/database.js'

const TABELAS = ['pets', 'agendamentos', 'historico_consultas', 'faturamentos']

async function migrar() {
  const qi = sequelize.getQueryInterface()

  // Veterinário que herda os dados existentes (admin criado no primeiro boot)
  const [admins] = await sequelize.query(
    "SELECT id FROM veterinarios WHERE email = 'admin@vetassist.com' LIMIT 1"
  )
  if (admins.length === 0) {
    throw new Error('Veterinário admin não encontrado — rode o backend uma vez antes.')
  }
  const adminId = admins[0].id
  console.log(`[INFO] Dados existentes serão atribuídos ao veterinário id=${adminId}`)

  for (const tabela of TABELAS) {
    const desc = await qi.describeTable(tabela)
    if (!desc.veterinarioId) {
      await qi.addColumn(tabela, 'veterinarioId', {
        type: DataTypes.INTEGER,
        allowNull: true,
      })
      console.log(`[OK] Coluna veterinarioId adicionada em ${tabela}`)
    } else {
      console.log(`[SKIP] ${tabela} já tem veterinarioId`)
    }
  }

  // Backfill: tudo que está NULL vira do admin (inclui clientes/despesas/veiculos legados)
  for (const tabela of [...TABELAS, 'clientes', 'despesas', 'veiculos']) {
    const [, meta] = await sequelize.query(
      `UPDATE ${tabela} SET veterinarioId = ${adminId} WHERE veterinarioId IS NULL`
    )
    const afetados = meta?.changes ?? meta ?? '?'
    console.log(`[OK] ${tabela}: registros atribuídos ao admin (${afetados})`)
  }

  await sequelize.close()
  console.log('[OK] Migração multi-tenancy concluída!')
}

migrar().catch(err => {
  console.error('[ERRO] Migração falhou:', err.message)
  process.exit(1)
})
