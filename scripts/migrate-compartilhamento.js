// Migração: cria a tabela compartilhamentos para compartilhamento de animais entre veterinários
// Executar com o backend PARADO: node scripts/migrate-compartilhamento.js
import { DataTypes } from 'sequelize'
import sequelize from '../backend/database.js'

async function migrar() {
  const qi = sequelize.getQueryInterface()

  try {
    // Verificar se tabela já existe
    const tables = await qi.showAllTables()
    if (tables.includes('compartilhamentos')) {
      console.log('[SKIP] Tabela compartilhamentos já existe')
      await sequelize.close()
      return
    }

    // Criar tabela
    await qi.createTable('compartilhamentos', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      animalId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      veterinarioOrigemId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      veterinarioConvidadoId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      emailConvidado: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      permissoes: {
        type: DataTypes.JSON,
        defaultValue: ['ver'],
      },
      token: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING,
        defaultValue: 'pendente',
      },
      aceitoEm: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    })

    console.log('[OK] Tabela compartilhamentos criada com sucesso')
  } catch (err) {
    console.error('[ERRO] Erro ao criar tabela:', err.message)
    throw err
  } finally {
    await sequelize.close()
  }
}

migrar()
  .then(() => {
    console.log('[OK] Migração concluída!')
    process.exit(0)
  })
  .catch(err => {
    console.error('[ERRO] Migração falhou:', err.message)
    process.exit(1)
  })
