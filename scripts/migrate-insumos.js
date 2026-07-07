// Migração: cria a tabela insumos (Estoque de Insumos)
// Executar com o backend PARADO: node scripts/migrate-insumos.js
import { DataTypes } from 'sequelize'
import sequelize from '../backend/database.js'

async function migrar() {
  const qi = sequelize.getQueryInterface()
  const tabelas = await qi.showAllTables()

  if (!tabelas.includes('insumos')) {
    await qi.createTable('insumos', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      veterinarioId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      nome: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      unidade: {
        type: DataTypes.STRING,
        defaultValue: 'un',
      },
      quantidadeEstoque: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
      quantidadeMinima: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
      custoUnitario: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
      precoVenda: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    })
    console.log('[OK] Tabela insumos criada')
  } else {
    console.log('[SKIP] Tabela insumos já existe')
  }

  await sequelize.close()
  console.log('[OK] Migração concluída!')
}

migrar().catch(err => {
  console.error('[ERRO] Migração falhou:', err.message)
  process.exit(1)
})
