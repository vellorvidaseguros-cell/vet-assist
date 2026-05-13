import express from 'express';
import { listarVacinas, listarVacinasPorPet, criarVacina, atualizarVacina, deletarVacina } from '../controllers/VacinaController.js';

const router = express.Router();

router.get('/', listarVacinas);
router.get('/pet/:petId', listarVacinasPorPet);
router.post('/', criarVacina);
router.put('/:id', atualizarVacina);
router.delete('/:id', deletarVacina);

export default router;
