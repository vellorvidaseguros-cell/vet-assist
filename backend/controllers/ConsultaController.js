import { Consulta, Pet, Cliente } from '../models/index.js';

export const listarConsultas = async (req, res) => {
  try {
    const consultas = await Consulta.findAll({
      include: [Pet, Cliente],
      order: [['data', 'DESC']]
    });
    res.json({ sucesso: true, data: consultas });
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: erro.message });
  }
};

export const criarConsulta = async (req, res) => {
  try {
    const { petId, clienteId, data, tipoAtendimento, diagnostico, procedimentos, proximoRetorno, veterinario, valor, statusPagamento, observacoes } = req.body;

    if (!petId || !clienteId || !data) {
      return res.status(400).json({ sucesso: false, erro: 'PetId, clienteId e data são obrigatórios' });
    }

    const consulta = await Consulta.create({
      petId,
      clienteId,
      data,
      tipoAtendimento: tipoAtendimento || 'Consulta',
      diagnostico,
      procedimentos,
      proximoRetorno,
      veterinario,
      valor: valor || 0,
      statusPagamento: statusPagamento || 'Pendente',
      observacoes
    });

    res.status(201).json({ sucesso: true, mensagem: 'Consulta registrada!', data: consulta });
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: erro.message });
  }
};

export const atualizarConsulta = async (req, res) => {
  try {
    const consulta = await Consulta.findByPk(req.params.id);
    if (!consulta) return res.status(404).json({ sucesso: false, erro: 'Consulta não encontrada' });

    await consulta.update(req.body);
    res.json({ sucesso: true, mensagem: 'Consulta atualizada!', data: consulta });
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: erro.message });
  }
};

export const deletarConsulta = async (req, res) => {
  try {
    const consulta = await Consulta.findByPk(req.params.id);
    if (!consulta) return res.status(404).json({ sucesso: false, erro: 'Consulta não encontrada' });

    await consulta.destroy();
    res.json({ sucesso: true, mensagem: 'Consulta deletada!' });
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: erro.message });
  }
};
