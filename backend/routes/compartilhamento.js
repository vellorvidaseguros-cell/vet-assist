import express from 'express'
import { exigirRecurso } from '../middleware/auth.js'
import {
  criarCompartilhamento,
  listarCompartilhamentos,
  verPropostaPublica,
  aceitarCompartilhamento,
  listarCompartilhadosComigo,
  listarMeusCompartilhamentos,
  listarConvitesRecebidos,
  aceitarConvitePorId,
  recusarConvitePorId,
  revogarCompartilhamento
} from '../controllers/CompartilhamentoController.js'

const router = express.Router()

// As rotas do lado de quem COMPARTILHA (VetA) exigem o recurso 'compartilhamento'
// do plano. As do lado de quem RECEBE o convite (VetB) ficam livres — não é justo
// bloquear alguém de aceitar um convite só porque o próprio plano dele é menor;
// quem paga pelo recurso é sempre quem compartilha.

// Criar convite de compartilhamento (autenticado — VetA)
router.post('/animais/:animalId/compartilhamentos', exigirRecurso('compartilhamento'), criarCompartilhamento)

// Listar quem tem acesso a um animal (autenticado — VetA)
router.get('/animais/:animalId/compartilhamentos', exigirRecurso('compartilhamento'), listarCompartilhamentos)

// Ver proposta (PUBLIC — sem autenticação)
router.get('/publico/:token', verPropostaPublica)

// Aceitar compartilhamento (PUBLIC ou autenticado — VetB)
router.post('/:token/aceitar', aceitarCompartilhamento)

// Listar animais compartilhados comigo (autenticado — VetB)
router.get('/compartilhados-comigo', listarCompartilhadosComigo)

// Convites pendentes recebidos por mim (autenticado — VetB)
router.get('/convites-recebidos', listarConvitesRecebidos)

// Aceitar / recusar um convite pelo ID, dentro do app (autenticado — VetB)
router.post('/convites/:id/aceitar', aceitarConvitePorId)
router.post('/convites/:id/recusar', recusarConvitePorId)

// Listar compartilhamentos que EU criei (autenticado — VetA)
router.get('/meus', exigirRecurso('compartilhamento'), listarMeusCompartilhamentos)

// Revogar acesso (autenticado — VetA)
router.delete('/animais/:animalId/compartilhamentos/:compartilhamentoId', exigirRecurso('compartilhamento'), revogarCompartilhamento)

export default router
