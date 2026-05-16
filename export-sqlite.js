/**
 * SCRIPT DE EXPORTAÇÃO — SQLite → JSON
 *
 * Uso: node export-sqlite.js
 * Gera: backup_data.json com todos os dados do banco local
 */

import { Sequelize, DataTypes } from 'sequelize';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, 'vet_assist.db');

if (!fs.existsSync(DB_PATH)) {
  console.error('❌ Banco de dados não encontrado:', DB_PATH);
  process.exit(1);
}

console.log('📦 Conectando ao SQLite:', DB_PATH);

const sqlite = new Sequelize({
  dialect: 'sqlite',
  storage: DB_PATH,
  logging: false,
});

// Tabelas na ordem correta (respeita foreign keys)
const TABELAS = [
  'veterinarios',
  'clientes',
  'pets',
  'agendamentos',
  'consultas',
  'vacinas',
  'historico_consultas',
  'anexos',
  'faturamentos',
  'veiculos',
  'despesas',
];

async function exportar() {
  try {
    await sqlite.authenticate();
    console.log('✅ Conectado ao SQLite\n');

    const dados = {};
    let totalRegistros = 0;

    for (const tabela of TABELAS) {
      try {
        const [rows] = await sqlite.query(`SELECT * FROM ${tabela}`);
        dados[tabela] = rows;
        totalRegistros += rows.length;
        console.log(`  ✓ ${tabela}: ${rows.length} registros`);
      } catch (err) {
        // Tabela não existe — ignora
        console.log(`  - ${tabela}: não encontrada (ignorado)`);
        dados[tabela] = [];
      }
    }

    const outputPath = path.join(__dirname, 'backup_data.json');
    fs.writeFileSync(outputPath, JSON.stringify(dados, null, 2), 'utf-8');

    console.log(`\n🎉 Exportação concluída!`);
    console.log(`   Total de registros: ${totalRegistros}`);
    console.log(`   Arquivo gerado: ${outputPath}`);
    console.log(`\n➡️  Próximo passo: configure DATABASE_URL e rode node import-postgres.js`);

  } catch (err) {
    console.error('❌ Erro na exportação:', err.message);
    process.exit(1);
  } finally {
    await sqlite.close();
  }
}

exportar();
