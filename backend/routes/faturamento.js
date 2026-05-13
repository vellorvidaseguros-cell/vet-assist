import express from 'express'
import { listarFaturamentos, resumoFinanceiro, criarFaturamento, atualizarFaturamento, registrarPagamento, deletarPagamento, apagarTodos } from '../controllers/FaturamentoController.js'

const router = express.Router()

// Rotas específicas ANTES de rotas genéricas
router.get('/resumo/financeiro', resumoFinanceiro)
router.post('/:id/pagamento', registrarPagamento)
router.delete('/:id/pagamento/:index', deletarPagamento)
router.delete('/apagar/todos', apagarTodos)

// Rotas genéricas
router.get('/', listarFaturamentos)
router.post('/', criarFaturamento)
router.put('/:id', atualizarFaturamento)

export default router
