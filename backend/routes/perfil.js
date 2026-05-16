import express from 'express'
import { obterPerfil, atualizarPerfil, saveWhiteLabel, obterLogoBase64, obterTabelaPrecos, atualizarTabelaPrecos } from '../controllers/PerfilController.js'
import { upload } from '../middleware/upload.js'

const router = express.Router()

// Tabela de preços
router.get('/tabela-precos', obterTabelaPrecos)
router.put('/tabela-precos', atualizarTabelaPrecos)

// Usar veterinarioId 1 como padrão (usuário logado)
router.get('/', (req, res, next) => {
  req.params.veterinarioId = 1
  obterPerfil(req, res, next)
})

router.put('/', (req, res, next) => {
  req.params.veterinarioId = 1
  atualizarPerfil(req, res, next)
})

// Logo como base64 (para uso em PDFs, sem CORS)
router.get('/logo-base64', (req, res, next) => {
  req.params.veterinarioId = 1
  obterLogoBase64(req, res, next)
})

router.get('/logo-base64/:veterinarioId', obterLogoBase64)

router.get('/:veterinarioId', obterPerfil)
router.put('/:veterinarioId', atualizarPerfil)

router.post('/white-label', upload.single('logomarca'), (req, res, next) => {
  req.params.veterinarioId = 1
  saveWhiteLabel(req, res, next)
})

router.post('/white-label/:veterinarioId', upload.single('logomarca'), saveWhiteLabel)

export default router
