import express from 'express'
import { criarAviso, listarAvisos } from '../controllers/AvisoController.js'

const router = express.Router()

router.post('/', criarAviso)
router.get('/', listarAvisos)

export default router
