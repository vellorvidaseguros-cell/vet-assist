import express from 'express'
import { exigirAdmin } from '../middleware/auth.js'
import { obterCatalogoPlanos, listarContas, criarConta, atualizarConta } from '../controllers/AdminController.js'

const router = express.Router()

// Todas as rotas do painel exigem papel admin
router.use(exigirAdmin)

router.get('/planos', obterCatalogoPlanos)
router.get('/contas', listarContas)
router.post('/contas', criarConta)
router.put('/contas/:id', atualizarConta)

export default router
