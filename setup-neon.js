/**
 * Cria as tabelas no Neon e importa os dados do backup_data.json
 * Uso: node setup-neon.js
 */
import { Sequelize, DataTypes } from 'sequelize'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.migration' })

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL não definida em .env.migration')
  process.exit(1)
}

const pg = new Sequelize(DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
  logging: false
})

// ── Definir modelos na ordem correta ──
const Veterinario = pg.define('Veterinario', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nome: DataTypes.STRING, email: DataTypes.STRING, senha: DataTypes.STRING,
  telefone: DataTypes.STRING, cpf: DataTypes.STRING, crmv: DataTypes.STRING,
  dataNascimento: DataTypes.DATE, genero: DataTypes.STRING,
  endereco: DataTypes.STRING, cidade: DataTypes.STRING, estado: DataTypes.STRING,
  nomeClinica: DataTypes.STRING, cnpj: DataTypes.STRING, especialidade: DataTypes.STRING,
  fotoPerfil: DataTypes.STRING, logomarcaUrl: DataTypes.STRING,
  tabelaPrecos: { type: DataTypes.TEXT, defaultValue: '{}' },
  whiteLabel: { type: DataTypes.TEXT, defaultValue: null }
}, { tableName: 'veterinarios', timestamps: true })

const Cliente = pg.define('Cliente', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  veterinarioId: DataTypes.INTEGER, nome: DataTypes.STRING, telefone: DataTypes.STRING,
  email: DataTypes.STRING, cpf: DataTypes.STRING, endereco: DataTypes.STRING,
  cidade: DataTypes.STRING, estado: DataTypes.STRING, dataUltimaConsulta: DataTypes.DATE
}, { tableName: 'clientes', timestamps: true })

const Pet = pg.define('Pet', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  clienteId: DataTypes.INTEGER, nome: DataTypes.STRING, especie: DataTypes.STRING,
  raca: DataTypes.STRING, sexo: DataTypes.STRING, porte: DataTypes.STRING,
  idade: DataTypes.INTEGER, cor: DataTypes.STRING, microchip: DataTypes.STRING,
  dataNascimento: DataTypes.DATE, status: { type: DataTypes.STRING, defaultValue: 'Ativo' }
}, { tableName: 'pets', timestamps: true })

const Agendamento = pg.define('Agendamento', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  petId: DataTypes.INTEGER, clienteId: DataTypes.INTEGER,
  data: DataTypes.DATE, hora: DataTypes.TIME,
  tipoAtendimento: DataTypes.STRING, descricao: DataTypes.TEXT,
  status: { type: DataTypes.STRING, defaultValue: 'Pendente' },
  observacoes: DataTypes.TEXT, valor: DataTypes.DECIMAL(10, 2),
  diagnostico: DataTypes.TEXT, procedimentos: DataTypes.TEXT,
  medicamentos: DataTypes.TEXT, proximoRetorno: DataTypes.DATE
}, { tableName: 'agendamentos', timestamps: true })

const HistoricoConsulta = pg.define('HistoricoConsulta', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  petId: DataTypes.INTEGER, clienteId: DataTypes.INTEGER,
  data: DataTypes.DATE, tipoAtendimento: DataTypes.STRING,
  diagnostico: DataTypes.TEXT, procedimentos: DataTypes.TEXT,
  medicamentos: DataTypes.TEXT, observacoes: DataTypes.TEXT,
  proximoRetorno: DataTypes.DATE, veterinario: DataTypes.STRING,
  valor: DataTypes.DECIMAL(10, 2),
  statusPagamento: { type: DataTypes.STRING, defaultValue: 'Pendente' },
  status: { type: DataTypes.STRING, defaultValue: 'Concluído' }
}, { tableName: 'historico_consultas', timestamps: true })

const Anexo = pg.define('Anexo', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  agendamentoId: DataTypes.INTEGER, historicoConsultaId: DataTypes.INTEGER,
  nomeArquivo: DataTypes.STRING, caminhoArquivo: DataTypes.STRING,
  tipoMidia: DataTypes.STRING, tamanho: DataTypes.INTEGER
}, { tableName: 'anexos', timestamps: true })

const Faturamento = pg.define('Faturamento', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  historicoConsultaId: DataTypes.INTEGER, clienteId: DataTypes.INTEGER,
  valor: DataTypes.DECIMAL(10, 2), valorRecebido: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  status: { type: DataTypes.STRING, defaultValue: 'Pendente' },
  dataEmissao: DataTypes.DATE, dataPagamento: DataTypes.DATE,
  dataUltimoPagamento: DataTypes.DATE, descricao: DataTypes.TEXT,
  numeroNota: DataTypes.STRING,
  historicoPagamentos: { type: DataTypes.TEXT, defaultValue: '[]' }
}, { tableName: 'faturamentos', timestamps: true })

const Despesa = pg.define('Despesa', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  descricao: DataTypes.STRING, valor: DataTypes.DECIMAL(10, 2),
  categoria: DataTypes.STRING, data: DataTypes.DATE, observacoes: DataTypes.TEXT
}, { tableName: 'despesas', timestamps: true })

const TABELAS_MAP = {
  veterinarios: Veterinario,
  clientes: Cliente,
  pets: Pet,
  agendamentos: Agendamento,
  historico_consultas: HistoricoConsulta,
  anexos: Anexo,
  faturamentos: Faturamento,
  despesas: Despesa
}

async function setup() {
  try {
    await pg.authenticate()
    console.log('✅ Conectado ao Neon PostgreSQL\n')

    console.log('📦 Criando tabelas...')
    await pg.sync({ force: false })
    console.log('✅ Tabelas criadas!\n')

    // Importar dados se existir backup
    const backupPath = path.join(__dirname, 'backup_data.json')
    if (!fs.existsSync(backupPath)) {
      console.log('ℹ️  Nenhum backup encontrado. Tabelas criadas vazias.')
      return
    }

    const dados = JSON.parse(fs.readFileSync(backupPath, 'utf-8'))
    console.log('📥 Importando dados do backup...\n')

    const ORDEM = ['veterinarios', 'clientes', 'pets', 'agendamentos',
                   'historico_consultas', 'anexos', 'faturamentos', 'despesas']

    for (const tabela of ORDEM) {
      const modelo = TABELAS_MAP[tabela]
      const rows = dados[tabela] || []
      if (!rows.length) { console.log(`  - ${tabela}: vazio`); continue }

      let ok = 0, skip = 0
      for (const row of rows) {
        try {
          await modelo.upsert(row)
          ok++
        } catch (e) {
          skip++
        }
      }
      console.log(`  ✓ ${tabela}: ${ok} inseridos, ${skip} ignorados`)

      // Resetar sequência
      try {
        await pg.query(`SELECT setval('"${tabela}_id_seq"', COALESCE((SELECT MAX(id) FROM "${tabela}"), 0) + 1)`)
      } catch {}
    }

    console.log('\n🎉 Neon configurado com todos os seus dados!')
    console.log('   O banco estará disponível mesmo se o Railway resetar.\n')

  } catch (err) {
    console.error('❌ Erro:', err.message)
  } finally {
    await pg.close()
  }
}

setup()
