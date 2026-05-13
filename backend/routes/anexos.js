import express from 'express';
import { upload } from '../middleware/upload.js';
import {
  uploadArquivo,
  listarPorHistorico,
  listarPorAgendamento,
  deletarArquivo,
  obterArquivo,
  obterFotoUrl,
  obterFotoFile,
  listarTodosAnexos,
  limparFotosOrphans
} from '../controllers/AnexoController.js';
import { Anexo } from '../models/index.js';

const router = express.Router();

// Rotas específicas PRIMEIRO (para evitar conflitos de parâmetros)
router.post('/upload', upload.single('arquivo'), uploadArquivo);
router.get('/file/:id', obterFotoFile);
router.get('/url/:id', obterFotoUrl);
router.get('/download/:id', obterArquivo);
router.get('/debug/todos', listarTodosAnexos);
router.post('/debug/limpar-orphans', limparFotosOrphans);
router.post('/debug/force-link/:anexoId/:historicoId', async (req, res) => {
  try {
    const { anexoId, historicoId } = req.params;
    const anexo = await Anexo.findByPk(anexoId);
    if (!anexo) return res.status(404).json({ sucesso: false, erro: 'Anexo não encontrado' });

    await anexo.update({ historicoConsultaId: parseInt(historicoId) });
    res.json({ sucesso: true, mensagem: 'Anexo linkedado ao histórico com sucesso', data: anexo });
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: erro.message });
  }
});
router.get('/historico/:historicoId', listarPorHistorico);
router.get('/agendamento/:agendamentoId', listarPorAgendamento);
router.delete('/:id', deletarArquivo);

export default router;
