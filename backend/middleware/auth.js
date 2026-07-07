import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import { Veterinario } from '../models/index.js'
import { permissoesEfetivas } from '../config/planos.js'

dotenv.config()

const JWT_SECRET = process.env.JWT_SECRET || 'sua-chave-secreta-super-segura-aqui'

// Rotas públicas (caminho relativo ao mount point /api)
const ROTAS_PUBLICAS = [
  '/veterinarios/login',
  '/veterinarios/esqueci-senha',
  '/veterinarios/atualizar-senha',
  '/status',
  '/backend-info',
]

// Padrões regex para rotas públicas (ex: /compartilhamento/publico/token123)
const ROTAS_PUBLICAS_REGEX = [
  /^\/compartilhamento\/publico\/[^/]+$/,  // GET /compartilhamento/publico/:token
  // POST /compartilhamento/:token/aceitar — apenas 1 segmento (o token).
  // Não pode capturar /compartilhamento/convites/:id/aceitar (rota autenticada).
  /^\/compartilhamento\/[^/]+\/aceitar$/,
]

// Middleware de autenticação JWT para todas as rotas /api.
// Aceita o token no header Authorization (Bearer) ou, para links abertos
// em nova aba/iframe (PDF, imagens), no query param ?token=
// A conta é recarregada do banco a cada requisição para que suspensão
// e mudança de plano/permissões tenham efeito imediato.
export async function autenticar(req, res, next) {
  if (ROTAS_PUBLICAS.includes(req.path)) {
    return next()
  }

  // Verificar rotas públicas por regex (ex: /compartilhamento/publico/token)
  if (ROTAS_PUBLICAS_REGEX.some(regex => regex.test(req.path))) {
    return next()
  }

  let token = null
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7)
  } else if (req.query.token) {
    token = req.query.token
  }

  if (!token) {
    return res.status(401).json({ sucesso: false, erro: 'Autenticação necessária' })
  }

  let payload
  try {
    payload = jwt.verify(token, JWT_SECRET)
  } catch (err) {
    return res.status(401).json({ sucesso: false, erro: 'Sessão expirada. Faça login novamente.' })
  }

  try {
    const conta = await Veterinario.findByPk(payload.id, {
      attributes: ['id', 'email', 'nome', 'role', 'plano', 'ativo', 'permissoes']
    })
    if (!conta) {
      return res.status(401).json({ sucesso: false, erro: 'Conta não encontrada. Faça login novamente.' })
    }
    if (!conta.ativo) {
      // 401 (e não 403) para o frontend deslogar automaticamente
      return res.status(401).json({ sucesso: false, erro: 'Conta suspensa. Entre em contato com o suporte.' })
    }

    req.veterinario = {
      id: conta.id,
      email: conta.email,
      nome: conta.nome,
      role: conta.role || 'vet',
      plano: conta.plano || 'basico',
      permissoes: permissoesEfetivas(conta),
    }
    return next()
  } catch (err) {
    return res.status(500).json({ sucesso: false, erro: 'Erro ao validar sessão' })
  }
}

// Guarda de rotas exclusivas do administrador do app
export function exigirAdmin(req, res, next) {
  if (req.veterinario?.role !== 'admin') {
    return res.status(403).json({ sucesso: false, erro: 'Acesso restrito ao administrador' })
  }
  return next()
}

// Guarda por recurso do plano. Uso: app.use('/api/agendamentos', exigirRecurso('agenda'), rotas)
export function exigirRecurso(chave) {
  return (req, res, next) => {
    if (req.veterinario?.role === 'admin') return next()
    if (req.veterinario?.permissoes?.includes(chave)) return next()
    return res.status(403).json({
      sucesso: false,
      erro: 'Recurso não incluído no seu plano. Fale com o administrador para fazer upgrade.',
      recursoNegado: chave,
    })
  }
}
