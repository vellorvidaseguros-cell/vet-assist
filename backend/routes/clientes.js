import express from 'express';
import { listarClientes, obterCliente, criarCliente, atualizarCliente, deletarCliente } from '../controllers/ClienteController.js';

const router = express.Router();

router.get('/', listarClientes);
router.get('/:id', obterCliente);
router.post('/', criarCliente);
router.put('/:id', atualizarCliente);
router.delete('/:id', deletarCliente);

export default router;
