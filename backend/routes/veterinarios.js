import express from 'express'
import { login, contaAtual, listarVeterinarios, obterVeterinario, criarVeterinario, atualizarVeterinario, deletarVeterinario } from '../controllers/VeterinarioController.js'
import { exigirAdmin } from '../middleware/auth.js'

const router = express.Router()

router.post('/login', login)
router.get('/me', contaAtual)
router.get('/', listarVeterinarios)
router.get('/:id', obterVeterinario)
// Criação de contas é exclusiva do admin (painel em /api/admin/contas)
router.post('/', exigirAdmin, criarVeterinario)
router.put('/:id', atualizarVeterinario)
router.delete('/:id', deletarVeterinario)

export default router
