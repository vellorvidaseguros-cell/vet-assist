import express from 'express'
import multer from 'multer'
import { exigirAdmin } from '../middleware/auth.js'
import { obterCatalogoPlanos, listarContas, criarConta, atualizarConta, deletarConta, restaurarFoto } from '../controllers/AdminController.js'

const router = express.Router()

// Upload em memória para restauração de backups (preserva nome original)
const uploadMemoria = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }
})

// Todas as rotas do painel exigem papel admin
router.use(exigirAdmin)

router.get('/planos', obterCatalogoPlanos)
router.get('/contas', listarContas)
router.post('/contas', criarConta)
router.put('/contas/:id', atualizarConta)
router.delete('/contas/:id', deletarConta)
router.post('/restaurar-foto', uploadMemoria.single('arquivo'), restaurarFoto)

export default router
