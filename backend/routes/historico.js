import express from 'express'
import { listarHistorico, historicoDoAnimal, criarHistorico, atualizarHistorico, deletarHistorico, apagarTodos } from '../controllers/HistoricoConsultaController.js'

const router = express.Router()

router.get('/', listarHistorico)
router.get('/animal/:petId', historicoDoAnimal)
router.post('/', criarHistorico)
router.put('/:id', atualizarHistorico)
router.delete('/apagar/todos', apagarTodos)
router.delete('/:id', deletarHistorico)

export default router
