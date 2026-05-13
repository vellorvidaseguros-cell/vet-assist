import { Cliente, Pet } from '../models/index.js';

export const listarClientes = async (req, res) => {
  try {
    const clientes = await Cliente.findAll({
      include: Pet,
      order: [['nome', 'ASC']]
    });
    res.json({ sucesso: true, data: clientes });
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: erro.message });
  }
};

export const obterCliente = async (req, res) => {
  try {
    const cliente = await Cliente.findByPk(req.params.id, {
      include: Pet
    });
    if (!cliente) return res.status(404).json({ sucesso: false, erro: 'Cliente não encontrado' });
    res.json({ sucesso: true, data: cliente });
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: erro.message });
  }
};

export const criarCliente = async (req, res) => {
  try {
    const { nome, telefone, email, cpf, endereco, cidade, estado } = req.body;

    if (!nome || !telefone) {
      return res.status(400).json({ sucesso: false, erro: 'Nome e telefone são obrigatórios' });
    }

    const cliente = await Cliente.create({
      veterinarioId: 1, // Por enquanto, veterinário padrão
      nome,
      telefone,
      email,
      cpf,
      endereco,
      cidade,
      estado
    });

    res.status(201).json({ sucesso: true, mensagem: `Cliente ${nome} cadastrado!`, data: cliente });
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: erro.message });
  }
};

export const atualizarCliente = async (req, res) => {
  try {
    const cliente = await Cliente.findByPk(req.params.id);
    if (!cliente) return res.status(404).json({ sucesso: false, erro: 'Cliente não encontrado' });

    await cliente.update(req.body);
    res.json({ sucesso: true, mensagem: 'Cliente atualizado!', data: cliente });
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: erro.message });
  }
};

export const deletarCliente = async (req, res) => {
  try {
    const cliente = await Cliente.findByPk(req.params.id);
    if (!cliente) return res.status(404).json({ sucesso: false, erro: 'Cliente não encontrado' });

    await cliente.destroy();
    res.json({ sucesso: true, mensagem: 'Cliente deletado!' });
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: erro.message });
  }
};
