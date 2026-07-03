import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

dotenv.config()

const JWT_SECRET = process.env.JWT_SECRET || 'sua-chave-secreta-super-segura-aqui'

// Rotas públicas (caminho relativo ao mount point /api)
const ROTAS_PUBLICAS = [
  '/veterinarios/login',
  '/status',
  '/backend-info',
]

// Middleware de autenticação JWT para todas as rotas /api.
// Aceita o token no header Authorization (Bearer) ou, para links abertos
// em nova aba/iframe (PDF, imagens), no query param ?token=
export function autenticar(req, res, next) {
  if (ROTAS_PUBLICAS.includes(req.path)) {
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

  try {
    const payload = jwt.verify(token, JWT_SECRET)
    req.veterinario = payload // { id, email }
    return next()
  } catch (err) {
    return res.status(401).json({ sucesso: false, erro: 'Sessão expirada. Faça login novamente.' })
  }
}
