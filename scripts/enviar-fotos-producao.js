// Envia as fotos de backend/uploads para o app em produção,
// preservando os nomes (os registros de Anexo apontam para eles).
// Uso:
//   APP_URL="https://seu-app.up.railway.app" ADMIN_EMAIL="admin@vetassist.com" ADMIN_SENHA="..." \
//     node scripts/enviar-fotos-producao.js
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const APP_URL = (process.env.APP_URL || '').replace(/\/$/, '')
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@vetassist.com'
const ADMIN_SENHA = process.env.ADMIN_SENHA

if (!APP_URL || !ADMIN_SENHA) {
  console.error('[ERRO] Defina APP_URL e ADMIN_SENHA nas variáveis de ambiente')
  process.exit(1)
}

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const uploadsDir = path.join(__dirname, '../backend/uploads')

async function enviar() {
  // Login como admin
  const loginRes = await fetch(`${APP_URL}/api/veterinarios/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, senha: ADMIN_SENHA }),
  })
  const login = await loginRes.json()
  if (!login.sucesso) {
    console.error('[ERRO] Login falhou:', login.erro)
    process.exit(1)
  }
  const token = login.token
  console.log('[OK] Logado como admin')

  const arquivos = fs.readdirSync(uploadsDir).filter(f =>
    fs.statSync(path.join(uploadsDir, f)).isFile()
  )
  console.log(`[INFO] ${arquivos.length} arquivo(s) para enviar`)

  let ok = 0, falha = 0
  for (const nome of arquivos) {
    try {
      const buffer = fs.readFileSync(path.join(uploadsDir, nome))
      const form = new FormData()
      form.append('arquivo', new Blob([buffer]), nome)

      const res = await fetch(`${APP_URL}/api/admin/restaurar-foto`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      })
      const json = await res.json()
      if (json.sucesso) {
        ok++
        process.stdout.write(`\r[${ok + falha}/${arquivos.length}] enviadas: ${ok}, falhas: ${falha}   `)
      } else {
        falha++
        console.error(`\n[FALHA] ${nome}: ${json.erro}`)
      }
    } catch (err) {
      falha++
      console.error(`\n[FALHA] ${nome}: ${err.message}`)
    }
  }

  console.log(`\n[OK] Concluído: ${ok} enviadas, ${falha} falha(s)`)
}

enviar().catch(err => {
  console.error('[ERRO]', err.message)
  process.exit(1)
})
