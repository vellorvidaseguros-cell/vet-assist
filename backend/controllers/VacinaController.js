import { Vacina, Pet } from '../models/index.js';

export const listarVacinas = async (req, res) => {
  try {
    const vacinas = await Vacina.findAll({
      include: Pet,
      order: [['dataAplicacao', 'DESC']]
    });
    res.json({ sucesso: true, data: vacinas });
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: erro.message });
  }
};

export const listarVacinasPorPet = async (req, res) => {
  try {
    const vacinas = await Vacina.findAll({
      where: { petId: req.params.petId },
      include: Pet
    });
    res.json({ sucesso: true, data: vacinas });
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: erro.message });
  }
};

export const criarVacina = async (req, res) => {
  try {
    const { petId, vacina, dataAplicacao, proximaDose, fabricante, lote, veterinario, observacoes } = req.body;

    if (!petId || !vacina || !dataAplicacao) {
      return res.status(400).json({ sucesso: false, erro: 'PetId, vacina e dataAplicacao são obrigatórios' });
    }

    const novaVacina = await Vacina.create({
      petId,
      vacina,
      dataAplicacao,
      proximaDose,
      fabricante,
      lote,
      veterinario,
      observacoes
    });

    res.status(201).json({ sucesso: true, mensagem: `Vacina ${vacina} registrada!`, data: novaVacina });
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: erro.message });
  }
};

export const atualizarVacina = async (req, res) => {
  try {
    const vacina = await Vacina.findByPk(req.params.id);
    if (!vacina) return res.status(404).json({ sucesso: false, erro: 'Vacina não encontrada' });

    await vacina.update(req.body);
    res.json({ sucesso: true, mensagem: 'Vacina atualizada!', data: vacina });
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: erro.message });
  }
};

export const deletarVacina = async (req, res) => {
  try {
    const vacina = await Vacina.findByPk(req.params.id);
    if (!vacina) return res.status(404).json({ sucesso: false, erro: 'Vacina não encontrada' });

    await vacina.destroy();
    res.json({ sucesso: true, mensagem: 'Vacina deletada!' });
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: erro.message });
  }
};
