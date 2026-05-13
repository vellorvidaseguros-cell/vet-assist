import express from 'express';
import { listarPets, listarPetsPorCliente, criarPet, atualizarPet, deletarPet } from '../controllers/PetController.js';

const router = express.Router();

router.get('/', listarPets);
router.get('/cliente/:clienteId', listarPetsPorCliente);
router.post('/', criarPet);
router.put('/:id', atualizarPet);
router.delete('/:id', deletarPet);

export default router;
