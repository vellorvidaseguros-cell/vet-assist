import express from 'express'
import { gerarPDFOrcamento } from '../controllers/OrcamentoController.js'

const router = express.Router()

router.post('/pdf', gerarPDFOrcamento)

export default router
