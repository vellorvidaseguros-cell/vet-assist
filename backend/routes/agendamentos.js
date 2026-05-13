import express from 'express';
import { listarAgendamentos, criarAgendamento, atualizarAgendamento, deletarAgendamento } from '../controllers/AgendamentoController.js';

const router = express.Router();

router.get('/', listarAgendamentos);
router.post('/', criarAgendamento);
router.put('/:id', atualizarAgendamento);
router.delete('/:id', deletarAgendamento);

export default router;
