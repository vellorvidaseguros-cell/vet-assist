// Migração: adiciona coluna deletedAt (soft-delete/paranoid) às tabelas
// principais e a coluna foto (avatar do animal) em pets.
// Executar com o backend PARADO: node scripts/migrate-softdelete-foto.js
import { DataTypes } from 'sequelize'
import sequelize from '../backend/database.js'

const TABELAS_SOFT_DELETE = ['clientes', 'pets', 'agendamentos', 'historico_consultas', 'despesas']

async function migrar() {
  const qi = sequelize.getQueryInterface()

  for (const tabela of TABELAS_SOFT_DELETE) {
    const desc = await qi.describeTable(tabela)
    if (!desc.deletedAt) {
      await qi.addColumn(tabela, 'deletedAt', {
        type: DataTypes.DATE,
        allowNull: true,
      })
      console.log(`[OK] Coluna deletedAt adicionada em ${tabela}`)
    } else {
      console.log(`[SKIP] ${tabela} já tem deletedAt`)
    }
  }

  const descPets = await qi.describeTable('pets')
  if (!descPets.foto) {
    await qi.addColumn('pets', 'foto', {
      type: DataTypes.STRING,
      allowNull: true,
    })
    console.log('[OK] Coluna foto adicionada em pets')
  } else {
    console.log('[SKIP] pets já tem foto')
  }

  await sequelize.close()
  console.log('[OK] Migração concluída!')
}

migrar().catch(err => {
  console.error('[ERRO] Migração falhou:', err.message)
  process.exit(1)
})
