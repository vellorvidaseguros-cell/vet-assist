/**
 * SCRIPT DE IMPORTAÇÃO — JSON → PostgreSQL (Railway)
 *
 * Uso:
 *   1. Copie a DATABASE_URL do Railway (serviço PostgreSQL → Variables)
 *   2. Rode: DATABASE_URL="postgresql://..." node import-postgres.js
 *
 * Ou crie um arquivo .env.migration com DATABASE_URL=... e rode:
 *   node import-postgres.js
 */

import { Sequelize } from 'sequelize';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.migration' }); // tenta carregar .env.migration
dotenv.config(); // fallback para .env

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL não definida!');
  console.error('   Crie um arquivo .env.migration com:');
  console.error('   DATABASE_URL=postgresql://...');
  process.exit(1);
}

const BACKUP_PATH = path.join(__dirname, 'backup_data.json');

if (!fs.existsSync(BACKUP_PATH)) {
  console.error('❌ Arquivo backup_data.json não encontrado!');
  console.error('   Rode primeiro: node export-sqlite.js');
  process.exit(1);
}

console.log('📥 Lendo backup_data.json...');
const dados = JSON.parse(fs.readFileSync(BACKUP_PATH, 'utf-8'));

console.log('🔗 Conectando ao PostgreSQL...');
const pg = new Sequelize(DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
  logging: false,
});

// Ordem de inserção (respeita foreign keys)
const ORDEM = [
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

// Colunas que contêm JSON (serializados como string no SQLite)
const COLUNAS_JSON = {
  veterinarios: ['whiteLabel', 'tabelaPrecos'],
  faturamentos: ['historicoPagamentos'],
};

function parseJSON(tabela, row) {
  const colunas = COLUNAS_JSON[tabela] || [];
  const novo = { ...row };
  for (const col of colunas) {
    if (novo[col] && typeof novo[col] === 'string') {
      try {
        novo[col] = JSON.parse(novo[col]);
      } catch {
        // mantém como string se não for JSON válido
      }
    }
  }
  return novo;
}

async function inserirTabela(tabela, rows) {
  if (!rows || rows.length === 0) {
    console.log(`  - ${tabela}: vazio (ignorado)`);
    return;
  }

  let inseridos = 0;
  let ignorados = 0;

  for (const row of rows) {
    const processado = parseJSON(tabela, row);

    // Montar colunas e valores
    const colunas = Object.keys(processado);
    const valores = Object.values(processado);
    const placeholders = valores.map((_, i) => `$${i + 1}`).join(', ');
    const colunasStr = colunas.map(c => `"${c}"`).join(', ');

    const sql = `
      INSERT INTO "${tabela}" (${colunasStr})
      VALUES (${placeholders})
      ON CONFLICT (id) DO NOTHING
    `;

    try {
      await pg.query(sql, { bind: valores });
      inseridos++;
    } catch (err) {
      ignorados++;
      if (ignorados <= 3) {
        console.log(`    ⚠️  Linha ignorada (${tabela} id=${row.id}): ${err.message.substring(0, 80)}`);
      }
    }
  }

  console.log(`  ✓ ${tabela}: ${inseridos} inseridos, ${ignorados} ignorados`);

  // Resetar a sequência do ID para evitar conflitos futuros
  try {
    await pg.query(`SELECT setval('"${tabela}_id_seq"', (SELECT MAX(id) FROM "${tabela}") + 1)`);
  } catch {
    // Sequência pode não existir — ignora
  }
}

async function importar() {
  try {
    await pg.authenticate();
    console.log('✅ Conectado ao PostgreSQL\n');

    console.log('🔄 Importando dados...\n');

    // Inserir na ordem correta (respeita foreign keys)
    for (const tabela of ORDEM) {
      await inserirTabela(tabela, dados[tabela]);
    }

    console.log('\n🎉 Importação concluída com sucesso!');
    console.log('   Seus dados estão agora no PostgreSQL do Railway.');

  } catch (err) {
    console.error('\n❌ Erro na importação:', err.message);
    process.exit(1);
  } finally {
    await pg.close();
  }
}

importar();
