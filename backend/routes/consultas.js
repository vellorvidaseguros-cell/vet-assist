import express from 'express';
import { listarConsultas, criarConsulta, atualizarConsulta, deletarConsulta } from '../controllers/ConsultaController.js';

const router = express.Router();

router.get('/', listarConsultas);
router.post('/', criarConsulta);
router.put('/:id', atualizarConsulta);
router.delete('/:id', deletarConsulta);

export default router;
