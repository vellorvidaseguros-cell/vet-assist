// Migra TODOS os dados do SQLite local para o PostgreSQL de produção.
// Uso (a URL deve ser a PÚBLICA do Railway, ex.: proxy.rlwy.net):
//   DATABASE_URL_PROD="postgresql://..." node scripts/migrar-dados-producao.js
//
// O script:
//  1. Cria o schema no Postgres usando os models atuais (sync)
//  2. Copia os dados preservando os IDs (FKs continuam válidas)
//  3. Corrige diferenças SQLite→Postgres (booleans 0/1, hora vazia)
//  4. Ajusta as sequences de autoincremento
// As FOTOS são enviadas separadamente por scripts/enviar-fotos-producao.js
import { Sequelize } from 'sequelize'
import path from 'path'
import { fileURLToPath } from 'url'

const urlProd = process.env.DATABASE_URL_PROD
if (!urlProd) {
  console.error('[ERRO] Defina DATABASE_URL_PROD com a URL PÚBLICA do Postgres do Railway')
  process.exit(1)
}

// Conexão de destino via database.js (importando com DATABASE_URL setada,
// os models sobem já apontando para o Postgres)
process.env.DATABASE_URL = urlProd
const { default: sequelizeProd } = await import('../backend/database.js')
await import('../backend/models/index.js')

// Conexão de origem: SQLite local, acesso raw
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const sqlite = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../vet_assist.db'),
  logging: false,
})

// Ordem respeita as FKs
const TABELAS = [
  'veterinarios', 'clientes', 'pets', 'agendamentos',
  'historico_consultas', 'faturamentos', 'anexos',
  'despesas', 'veiculos', 'consultas', 'vacinas',
]

// Colunas booleanas por tabela (SQLite guarda 0/1; Postgres exige true/false)
const BOOLEANOS = { veterinarios: ['ativo'] }

async function migrar() {
  console.log('[1/4] Criando schema no Postgres...')
  await sequelizeProd.sync({ force: false })

  const qiProd = sequelizeProd.getQueryInterface()

  for (const tabela of TABELAS) {
    let rows
    try {
      ;[rows] = await sqlite.query(`SELECT * FROM ${tabela}`)
    } catch {
      console.log(`[SKIP] ${tabela}: não existe no SQLite`)
      continue
    }
    if (rows.length === 0) {
      console.log(`[SKIP] ${tabela}: vazia`)
      continue
    }

    // Não duplicar se o destino já tem dados desta tabela
    const [[{ n }]] = await sequelizeProd.query(`SELECT COUNT(*)::int AS n FROM ${tabela}`)
    if (n > 0) {
      console.log(`[SKIP] ${tabela}: destino já tem ${n} registro(s) — pulando para não duplicar`)
      continue
    }

    // Descobrir colunas existentes no destino (ignorar colunas extras da origem)
    const descDestino = await qiProd.describeTable(tabela)

    const preparados = rows.map(row => {
      const limpo = {}
      for (const [col, val] of Object.entries(row)) {
        if (!descDestino[col]) continue
        let v = val
        if ((BOOLEANOS[tabela] || []).includes(col)) v = !!v
        // TIME vazio do SQLite não é válido no Postgres
        if (col === 'hora' && v === '') v = null
        limpo[col] = v
      }
      return limpo
    })

    await qiProd.bulkInsert(tabela, preparados)
    console.log(`[2/4] ${tabela}: ${preparados.length} registro(s) migrado(s)`)
  }

  console.log('[3/4] Ajustando sequences de autoincremento...')
  for (const tabela of TABELAS) {
    try {
      await sequelizeProd.query(
        `SELECT setval(pg_get_serial_sequence('${tabela}', 'id'), (SELECT COALESCE(MAX(id), 1) FROM ${tabela}))`
      )
    } catch { /* tabela sem sequence/vazia */ }
  }

  console.log('[4/4] Conferindo totais no destino...')
  for (const tabela of TABELAS) {
    try {
      const [[{ n }]] = await sequelizeProd.query(`SELECT COUNT(*)::int AS n FROM ${tabela}`)
      console.log(`  ${tabela}: ${n}`)
    } catch { /* ignora */ }
  }

  await sqlite.close()
  await sequelizeProd.close()
  console.log('[OK] Migração de dados concluída! Agora rode scripts/enviar-fotos-producao.js')
}

migrar().catch(err => {
  console.error('[ERRO] Migração falhou:', err.message)
  process.exit(1)
})
