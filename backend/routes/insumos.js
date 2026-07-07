import express from 'express'
import {
  listarInsumos,
  criarInsumo,
  atualizarInsumo,
  deletarInsumo,
  baixarEstoque,
  reporEstoque
} from '../controllers/InsumoController.js'

const router = express.Router()

router.get('/', listarInsumos)
router.post('/', criarInsumo)
router.put('/:id', atualizarInsumo)
router.delete('/:id', deletarInsumo)
router.post('/:id/baixar-estoque', baixarEstoque)
router.post('/:id/repor-estoque', reporEstoque)

export default router
