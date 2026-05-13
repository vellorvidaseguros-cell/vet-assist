import express from 'express'
import { login, listarVeterinarios, obterVeterinario, criarVeterinario, atualizarVeterinario, deletarVeterinario } from '../controllers/VeterinarioController.js'

const router = express.Router()

router.post('/login', login)
router.get('/', listarVeterinarios)
router.get('/:id', obterVeterinario)
router.post('/', criarVeterinario)
router.put('/:id', atualizarVeterinario)
router.delete('/:id', deletarVeterinario)

export default router
