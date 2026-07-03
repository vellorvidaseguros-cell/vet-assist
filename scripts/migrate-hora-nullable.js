// Migração pontual: tornar a coluna `hora` de agendamentos opcional (NULL permitido).
// Necessária porque sequelize.sync({ force: false }) não altera tabelas existentes.
// Executar com o backend PARADO: node scripts/migrate-hora-nullable.js
import { DataTypes } from 'sequelize'
import sequelize from '../backend/database.js'

async function migrar() {
  const qi = sequelize.getQueryInterface()
  await qi.changeColumn('agendamentos', 'hora', {
    type: DataTypes.TIME,
    allowNull: true,
  })
  const [antes] = await sequelize.query('SELECT COUNT(*) as total FROM agendamentos')
  console.log(`[OK] Coluna hora agora permite NULL. Registros preservados: ${antes[0].total}`)
  await sequelize.close()
}

migrar().catch(err => {
  console.error('[ERRO] Migração falhou:', err.message)
  process.exit(1)
})
