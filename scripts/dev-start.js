/**
 * Script de inicialização do ambiente de desenvolvimento
 *
 * Sequência:
 * 1. Inicia o backend (auto-detecta porta livre a partir de 5000)
 * 2. Aguarda o backend salvar a porta em .backend-port
 * 3. Inicia o Vite (lê a porta automaticamente via vite.config.js)
 */

import { spawn } from 'child_process'
import { existsSync, readFileSync, unlinkSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const PORT_FILE = resolve(ROOT, '.backend-port')

// Limpar arquivo de porta anterior
try {
  if (existsSync(PORT_FILE)) unlinkSync(PORT_FILE)
} catch {}

console.log('🚀 VetAssist - Iniciando ambiente de desenvolvimento...\n')

// Iniciar backend
console.log('⬆️  [1/2] Iniciando backend...')
const backend = spawn('node', ['backend/server.js'], {
  cwd: ROOT,
  stdio: 'inherit',
  env: { ...process.env }
})

backend.on('error', err => {
  console.error('❌ Erro no backend:', err.message)
  process.exit(1)
})

// Aguardar o arquivo .backend-port ser criado
async function aguardarPorta(timeout = 30000) {
  const inicio = Date.now()
  while (Date.now() - inicio < timeout) {
    if (existsSync(PORT_FILE)) {
      const porta = parseInt(readFileSync(PORT_FILE, 'utf8').trim())
      if (!isNaN(porta) && porta > 0) return porta
    }
    await new Promise(r => setTimeout(r, 300))
  }
  throw new Error('Timeout aguardando backend iniciar')
}

try {
  const porta = await aguardarPorta()
  console.log(`✅ [1/2] Backend rodando na porta ${porta}`)

  // Aguardar mais 2 segundos para o banco sincronizar
  await new Promise(r => setTimeout(r, 2000))

  // Iniciar frontend
  console.log('\n⬆️  [2/2] Iniciando frontend (Vite)...')
  const frontend = spawn('npm', ['run', 'dev'], {
    cwd: resolve(ROOT, 'frontend'),
    stdio: 'inherit',
    shell: true
  })

  frontend.on('error', err => {
    console.error('❌ Erro no frontend:', err.message)
  })

  console.log('\n✅ Ambiente iniciado! Acesse o app no browser quando o Vite exibir o link.\n')

  // Encerrar tudo junto quando Ctrl+C
  process.on('SIGINT', () => {
    console.log('\n🛑 Encerrando...')
    backend.kill()
    frontend.kill()
    process.exit(0)
  })

  process.on('SIGTERM', () => {
    backend.kill()
    frontend.kill()
    process.exit(0)
  })

} catch (err) {
  console.error('❌ Erro ao iniciar:', err.message)
  backend.kill()
  process.exit(1)
}
