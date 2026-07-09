import express from 'express'
import { enviarFeedback, listarFeedbacks, atualizarStatusFeedback } from '../controllers/FeedbackController.js'

const router = express.Router()

router.post('/', enviarFeedback)
router.get('/', listarFeedbacks)
router.put('/:id', atualizarStatusFeedback)

export default router
