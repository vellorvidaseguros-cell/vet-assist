import express from 'express'
import { listarDespesas, resumoDespesas, criarDespesa, atualizarDespesa, deletarDespesa } from '../controllers/DespesaController.js'

const router = express.Router()

router.get('/:veterinarioId', listarDespesas)
router.get('/:veterinarioId/resumo', resumoDespesas)
router.post('/', criarDespesa)
router.put('/:id', atualizarDespesa)
router.delete('/:id', deletarDespesa)

export default router
