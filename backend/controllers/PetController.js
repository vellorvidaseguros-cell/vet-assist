import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { Op } from 'sequelize';
import { Pet, Cliente, TransferenciaProprietario, Compartilhamento } from '../models/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '../uploads');

// Multi-tenancy: todas as operações são restritas ao veterinário logado
// (req.veterinario vem do middleware de autenticação JWT)

export const listarPets = async (req, res) => {
  try {
    // Animais compartilhados aceitos também aparecem para o VetB
    const compartilhamentos = await Compartilhamento.findAll({
      where: { veterinarioConvidadoId: req.veterinario.id, status: 'aceito' },
      attributes: ['animalId']
    });
    const animalIdsCompartilhados = compartilhamentos.map(c => c.animalId);

    const pets = await Pet.findAll({
      where: animalIdsCompartilhados.length > 0 ? {
        [Op.or]: [
          { veterinarioId: req.veterinario.id },
          { id: animalIdsCompartilhados }
        ]
      } : {
        veterinarioId: req.veterinario.id
      },
      include: Cliente
    });

    res.json({ sucesso: true, data: pets });
  } catch (erro) {
    console.error('[ERROR] listarPets:', erro);
    res.status(500).json({ sucesso: false, erro: erro.message });
  }
};

export const listarPetsPorCliente = async (req, res) => {
  try {
    const pets = await Pet.findAll({
      where: { clienteId: req.params.clienteId, veterinarioId: req.veterinario.id },
      include: Cliente
    });
    res.json({ sucesso: true, data: pets });
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: erro.message });
  }
};

export const criarPet = async (req, res) => {
  try {
    const { clienteId, nome, especie, raca, sexo, porte, idade, cor, microchip, dataNascimento } = req.body;

    if (!clienteId || !nome || !especie) {
      return res.status(400).json({ sucesso: false, erro: 'ClienteId, nome e espécie são obrigatórios' });
    }

    // O cliente informado precisa pertencer ao veterinário logado
    const cliente = await Cliente.findOne({
      where: { id: clienteId, veterinarioId: req.veterinario.id }
    });
    if (!cliente) {
      return res.status(404).json({ sucesso: false, erro: 'Cliente não encontrado' });
    }

    // Converter idade para número se fornecida
    const dadosPet = {
      clienteId,
      veterinarioId: req.veterinario.id,
      nome,
      especie,
      raca: raca || null,
      sexo: sexo || null,
      porte: porte || null,
      idade: idade ? parseInt(idade) : null,
      cor: cor || null,
      microchip: microchip && microchip.trim() ? microchip.trim() : null,
      dataNascimento: dataNascimento || null
    };

    const pet = await Pet.create(dadosPet);

    // Registra o cadastro inicial no histórico de proprietários (sem dono anterior)
    await TransferenciaProprietario.create({
      petId: pet.id,
      veterinarioId: req.veterinario.id,
      clienteAnteriorId: null,
      clienteNovoId: clienteId,
      motivo: 'Cadastro inicial'
    });

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
    const pet = await Pet.findOne({
      where: { id: req.params.id, veterinarioId: req.veterinario.id }
    });
    if (!pet) return res.status(404).json({ sucesso: false, erro: 'Pet não encontrado' });

    // Nunca permitir troca de dono via payload (use /transferir para preservar histórico)
    const dados = { ...req.body };
    delete dados.veterinarioId;
    delete dados.clienteId;

    await pet.update(dados);
    res.json({ sucesso: true, mensagem: 'Pet atualizado!', data: pet });
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: erro.message });
  }
};

export const deletarPet = async (req, res) => {
  try {
    const pet = await Pet.findOne({
      where: { id: req.params.id, veterinarioId: req.veterinario.id }
    });
    if (!pet) return res.status(404).json({ sucesso: false, erro: 'Pet não encontrado' });

    await pet.destroy();
    res.json({ sucesso: true, mensagem: 'Pet deletado!' });
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: erro.message });
  }
};

// Transfere o animal para outro proprietário preservando todo o histórico
// (consultas, fotos, etc. continuam vinculados ao mesmo petId).
export const transferirProprietario = async (req, res) => {
  try {
    const { novoClienteId, motivo } = req.body;
    if (!novoClienteId) {
      return res.status(400).json({ sucesso: false, erro: 'novoClienteId é obrigatório' });
    }

    const pet = await Pet.findOne({
      where: { id: req.params.id, veterinarioId: req.veterinario.id }
    });
    if (!pet) return res.status(404).json({ sucesso: false, erro: 'Pet não encontrado' });

    if (parseInt(novoClienteId) === pet.clienteId) {
      return res.status(400).json({ sucesso: false, erro: 'O animal já pertence a este cliente' });
    }

    const novoCliente = await Cliente.findOne({
      where: { id: novoClienteId, veterinarioId: req.veterinario.id }
    });
    if (!novoCliente) {
      return res.status(404).json({ sucesso: false, erro: 'Cliente de destino não encontrado' });
    }

    const clienteAnteriorId = pet.clienteId;

    await TransferenciaProprietario.create({
      petId: pet.id,
      veterinarioId: req.veterinario.id,
      clienteAnteriorId,
      clienteNovoId: novoCliente.id,
      motivo: motivo || null
    });

    await pet.update({ clienteId: novoCliente.id });

    res.json({ sucesso: true, mensagem: `${pet.nome} transferido para ${novoCliente.nome}!`, data: pet });
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: erro.message });
  }
};

// Lista o histórico completo de proprietários de um animal (mais recente primeiro)
export const listarHistoricoProprietarios = async (req, res) => {
  try {
    const pet = await Pet.findOne({
      where: { id: req.params.id, veterinarioId: req.veterinario.id }
    });
    if (!pet) return res.status(404).json({ sucesso: false, erro: 'Pet não encontrado' });

    const historico = await TransferenciaProprietario.findAll({
      where: { petId: pet.id },
      include: [
        { model: Cliente, as: 'ClienteAnterior', attributes: ['id', 'nome'] },
        { model: Cliente, as: 'ClienteNovo', attributes: ['id', 'nome'] }
      ],
      order: [['dataTransferencia', 'DESC']]
    });

    res.json({ sucesso: true, data: historico });
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: erro.message });
  }
};

// Recebe a foto de perfil do animal (multer já salvou o arquivo em uploadsDir)
export const uploadFotoPet = async (req, res) => {
  try {
    const pet = await Pet.findOne({
      where: { id: req.params.id, veterinarioId: req.veterinario.id }
    });
    if (!pet) return res.status(404).json({ sucesso: false, erro: 'Pet não encontrado' });

    if (!req.file) {
      return res.status(400).json({ sucesso: false, erro: 'Nenhuma foto enviada' });
    }

    // Remove a foto anterior do disco, se existir, para não acumular arquivos órfãos
    if (pet.foto) {
      const caminhoAntigo = path.join(uploadsDir, pet.foto);
      if (fs.existsSync(caminhoAntigo)) fs.unlinkSync(caminhoAntigo);
    }

    await pet.update({ foto: req.file.filename });

    res.json({ sucesso: true, mensagem: 'Foto atualizada!', data: { foto: pet.foto } });
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: erro.message });
  }
};

// Serve a foto do animal (protegido por token, igual aos anexos)
export const obterFotoPet = async (req, res) => {
  try {
    const pet = await Pet.findOne({
      where: { id: req.params.id, veterinarioId: req.veterinario.id }
    });
    if (!pet || !pet.foto) {
      return res.status(404).json({ sucesso: false, erro: 'Foto não encontrada' });
    }

    const caminho = path.join(uploadsDir, pet.foto);
    if (!fs.existsSync(caminho)) {
      return res.status(404).json({ sucesso: false, erro: 'Arquivo não existe no servidor' });
    }

    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.sendFile(caminho);
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: erro.message });
  }
};
