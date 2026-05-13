import { Pet, Cliente } from '../models/index.js';

export const listarPets = async (req, res) => {
  try {
    const pets = await Pet.findAll({ include: Cliente });
    res.json({ sucesso: true, data: pets });
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: erro.message });
  }
};

export const listarPetsPorCliente = async (req, res) => {
  try {
    const pets = await Pet.findAll({
      where: { clienteId: req.params.clienteId },
      include: Cliente
    });
    res.json({ sucesso: true, data: pets });
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: erro.message });
  }
};

export const criarPet = async (req, res) => {
  try {
    const { clienteId, nome, especie, raca, sexo, porte, idade, cor, microchip } = req.body;

    if (!clienteId || !nome || !especie) {
      return res.status(400).json({ sucesso: false, erro: 'ClienteId, nome e espécie são obrigatórios' });
    }

    // Converter idade para número se fornecida
    const dadosPet = {
      clienteId,
      nome,
      especie,
      raca: raca || null,
      sexo: sexo || null,
      porte: porte || null,
      idade: idade ? parseInt(idade) : null,
      cor: cor || null,
      microchip: microchip && microchip.trim() ? microchip.trim() : null
    };

    const pet = await Pet.create(dadosPet);

    res.status(201).json({ sucesso: true, mensagem: `Pet ${nome} cadastrado!`, data: pet });
  } catch (erro) {
    console.error('[ERROR] Erro ao criar pet:', erro);

    // Tratamento específico de erros do Sequelize
    if (erro.name === 'SequelizeValidationError') {
      const mensagens = erro.errors.map(e => e.message).join(', ');
      return res.status(400).json({ sucesso: false, erro: `Validação: ${mensagens}` });
    }

    if (erro.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ sucesso: false, erro: 'Microchip já cadastrado' });
    }

    res.status(500).json({ sucesso: false, erro: erro.message || 'Erro ao criar pet' });
  }
};

export const atualizarPet = async (req, res) => {
  try {
    const pet = await Pet.findByPk(req.params.id);
    if (!pet) return res.status(404).json({ sucesso: false, erro: 'Pet não encontrado' });

    await pet.update(req.body);
    res.json({ sucesso: true, mensagem: 'Pet atualizado!', data: pet });
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: erro.message });
  }
};

export const deletarPet = async (req, res) => {
  try {
    const pet = await Pet.findByPk(req.params.id);
    if (!pet) return res.status(404).json({ sucesso: false, erro: 'Pet não encontrado' });

    await pet.destroy();
    res.json({ sucesso: true, mensagem: 'Pet deletado!' });
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: erro.message });
  }
};
