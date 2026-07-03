// Migração de planos/permissões: adiciona role, plano e permissoes
// à tabela veterinarios e configura as contas existentes.
// Executar com o backend PARADO: node scripts/migrate-planos.js
import { DataTypes } from 'sequelize'
import sequelize from '../backend/database.js'

async function migrar() {
  const qi = sequelize.getQueryInterface()
  const desc = await qi.describeTable('veterinarios')

  const novasColunas = {
    role: { type: DataTypes.STRING, defaultValue: 'vet' },
    plano: { type: DataTypes.STRING, defaultValue: 'basico' },
    permissoes: { type: DataTypes.TEXT, defaultValue: null },
  }

  for (const [coluna, def] of Object.entries(novasColunas)) {
    if (!desc[coluna]) {
      await qi.addColumn('veterinarios', coluna, def)
      console.log(`[OK] Coluna ${coluna} adicionada em veterinarios`)
    } else {
      console.log(`[SKIP] veterinarios já tem ${coluna}`)
    }
  }

  // Conta do dono do app vira admin
  await sequelize.query(
    "UPDATE veterinarios SET role = 'admin', plano = 'max' WHERE email = 'admin@vetassist.com'"
  )
  console.log('[OK] admin@vetassist.com definido como administrador do app')

  // Contas de veterinário existentes ganham plano Max (nada muda para elas)
  await sequelize.query(
    "UPDATE veterinarios SET role = 'vet', plano = 'max' WHERE email != 'admin@vetassist.com' AND (role IS NULL OR role = '' OR role = 'vet')"
  )
  const [contas] = await sequelize.query('SELECT id, nome, email, role, plano, ativo FROM veterinarios')
  console.log('[OK] Contas configuradas:', JSON.stringify(contas, null, 1))

  await sequelize.close()
  console.log('[OK] Migração de planos concluída!')
}

migrar().catch(err => {
  console.error('[ERRO] Migração falhou:', err.message)
  process.exit(1)
})
