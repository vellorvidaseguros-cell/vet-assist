// Migração: campos de precificação
// - veiculos: kmMensal, precoCombustivel, percentualUsoProfissional (correção do cálculo custo/km)
// - veterinarios: precificacao (hora técnica — custos fixos, pró-labore, horas)
// Executar com o backend PARADO: node scripts/migrate-precificacao.js
import { DataTypes } from 'sequelize'
import sequelize from '../backend/database.js'

async function migrar() {
  const qi = sequelize.getQueryInterface()

  // ===== veiculos =====
  const veiculos = await qi.describeTable('veiculos')

  if (!veiculos.kmMensal) {
    await qi.addColumn('veiculos', 'kmMensal', {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0,
    })
    console.log('[OK] Coluna kmMensal adicionada em veiculos')
  } else {
    console.log('[SKIP] veiculos já tem kmMensal')
  }

  if (!veiculos.precoCombustivel) {
    await qi.addColumn('veiculos', 'precoCombustivel', {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    })
    console.log('[OK] Coluna precoCombustivel adicionada em veiculos')
  } else {
    console.log('[SKIP] veiculos já tem precoCombustivel')
  }

  if (!veiculos.percentualUsoProfissional) {
    await qi.addColumn('veiculos', 'percentualUsoProfissional', {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 100,
    })
    console.log('[OK] Coluna percentualUsoProfissional adicionada em veiculos')
  } else {
    console.log('[SKIP] veiculos já tem percentualUsoProfissional')
  }

  // ===== veterinarios =====
  const veterinarios = await qi.describeTable('veterinarios')

  if (!veterinarios.precificacao) {
    await qi.addColumn('veterinarios', 'precificacao', {
      type: DataTypes.TEXT,
      allowNull: true,
    })
    console.log('[OK] Coluna precificacao adicionada em veterinarios')
  } else {
    console.log('[SKIP] veterinarios já tem precificacao')
  }

  await sequelize.close()
  console.log('[OK] Migração concluída!')
}

migrar().catch(err => {
  console.error('[ERRO] Migração falhou:', err.message)
  process.exit(1)
})
