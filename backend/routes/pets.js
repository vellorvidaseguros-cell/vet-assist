import express from 'express';
import { upload } from '../middleware/upload.js';
import { listarPets, listarPetsPorCliente, criarPet, atualizarPet, deletarPet, transferirProprietario, listarHistoricoProprietarios, uploadFotoPet, obterFotoPet } from '../controllers/PetController.js';

const router = express.Router();

router.get('/', listarPets);
router.get('/cliente/:clienteId', listarPetsPorCliente);
router.post('/', criarPet);
router.put('/:id', atualizarPet);
router.delete('/:id', deletarPet);
router.post('/:id/transferir', transferirProprietario);
router.get('/:id/historico-proprietarios', listarHistoricoProprietarios);
router.post('/:id/foto', upload.single('foto'), uploadFotoPet);
router.get('/:id/foto', obterFotoPet);

export default router;
