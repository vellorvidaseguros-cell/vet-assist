import express from 'express'
import { listarLixeira, restaurarItem } from '../controllers/LixeiraController.js'

const router = express.Router()

router.get('/', listarLixeira)
router.post('/:tipo/:id/restaurar', restaurarItem)

export default router
