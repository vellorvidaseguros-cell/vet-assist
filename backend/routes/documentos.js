import express from 'express'
import {
  salvarDocumento,
  listarDocumentos,
  buscarDocumento,
  deletarDocumento
} from '../controllers/DocumentoController.js'

const router = express.Router()

router.get('/', listarDocumentos)
router.post('/', salvarDocumento)
router.get('/:id', buscarDocumento)
router.delete('/:id', deletarDocumento)

export default router
