import bcrypt from 'bcryptjs'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { Op } from 'sequelize'
import {
  Veterinario, Cliente, Pet, Agendamento, HistoricoConsulta, Anexo,
  Faturamento, Veiculo, Despesa, Compartilhamento, Insumo, DocumentoEmitido
} from '../models/index.js'
import { RECURSOS, PLANOS, permissoesEfetivas } from '../config/planos.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Painel do administrador do app: gestão de contas de assinantes.
// Todas as rotas passam por exigirAdmin (ver routes/admin.js).

// Catálogo de recursos e presets de plano (para montar a UI)
export const obterCatalogoPlanos = (req, res) => {
  res.json({ sucesso: true, data: { recursos: RECURSOS, planos: PLANOS } })
}

// Lista todas as contas com plano, status e permissões efetivas
export const listarContas = async (req, res) => {
  try {
    const contas = await Veterinario.findAll({
      attributes: ['id', 'nome', 'email', 'telefone', 'role', 'plano', 'ativo', 'permissoes', 'createdAt'],
      order: [['createdAt', 'ASC']]
    })

    const data = await Promise.all(contas.map(async (c) => {
      const json = c.toJSON()
      json.permissoesEfetivas = permissoesEfetivas(c)
      json.totalClientes = await Cliente.count({ where: { veterinarioId: c.id } })
      json.totalAgendamentos = await Agendamento.count({ where: { veterinarioId: c.id } })
      return json
    }))

    res.json({ sucesso: true, data })
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: erro.message })
  }
}

// Cria uma nova conta de assinante
export const criarConta = async (req, res) => {
  try {
    const { nome, email, senha, telefone, plano, permissoes } = req.body

    if (!nome || !email || !senha) {
      return res.status(400).json({ sucesso: false, erro: 'Nome, email e senha são obrigatórios' })
    }
    if (plano && !PLANOS[plano]) {
      return res.status(400).json({ sucesso: false, erro: `Plano inválido: ${plano}` })
    }

    const jaExiste = await Veterinario.findOne({ where: { email } })
    if (jaExiste) {
      return res.status(400).json({ sucesso: false, erro: 'Já existe uma conta com este email' })
    }

    const senhaHasheada = await bcrypt.hash(senha, 10)
    const conta = await Veterinario.create({
      nome,
      email,
      senha: senhaHasheada,
      telefone: telefone || null,
      role: 'vet',
      plano: plano || 'basico',
      permissoes: Array.isArray(permissoes) && permissoes.length > 0 ? permissoes : null,
      ativo: true,
    })

    const data = conta.toJSON()
    delete data.senha
    data.permissoesEfetivas = permissoesEfetivas(conta)

    res.status(201).json({ sucesso: true, mensagem: `Conta de ${nome} criada!`, data })
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: erro.message })
  }
}

// Restaura uma foto de backup preservando o nome original do arquivo.
// Usado na migração local→produção (scripts/enviar-fotos-producao.js),
// pois o upload normal renomeia os arquivos e quebraria os registros de Anexo.
export const restaurarFoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ sucesso: false, erro: 'Nenhum arquivo enviado' })
    }
    // Apenas o nome-base: impede path traversal
    const nome = path.basename(req.file.originalname)
    if (!/^[\w.\-]+$/.test(nome)) {
      return res.status(400).json({ sucesso: false, erro: `Nome de arquivo inválido: ${nome}` })
    }

    const uploadsDir = path.join(__dirname, '../uploads')
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true })
    }
    fs.writeFileSync(path.join(uploadsDir, nome), req.file.buffer)

    res.json({ sucesso: true, mensagem: `Foto ${nome} restaurada` })
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: erro.message })
  }
}

// Atualiza plano, permissões, status (suspender/reativar), dados ou senha
export const atualizarConta = async (req, res) => {
  try {
    const conta = await Veterinario.findByPk(req.params.id)
    if (!conta) return res.status(404).json({ sucesso: false, erro: 'Conta não encontrada' })

    const { nome, email, telefone, plano, ativo, permissoes, senha } = req.body

    // Admin não pode suspender nem rebaixar a própria conta (evita lockout)
    if (conta.id === req.veterinario.id && (ativo === false || (req.body.role && req.body.role !== 'admin'))) {
      return res.status(400).json({ sucesso: false, erro: 'Você não pode suspender ou rebaixar a própria conta' })
    }
    if (plano && !PLANOS[plano]) {
      return res.status(400).json({ sucesso: false, erro: `Plano inválido: ${plano}` })
    }

    const atualizacoes = {}
    if (nome !== undefined) atualizacoes.nome = nome
    if (email !== undefined) atualizacoes.email = email
    if (telefone !== undefined) atualizacoes.telefone = telefone
    if (plano !== undefined) atualizacoes.plano = plano
    if (ativo !== undefined) atualizacoes.ativo = !!ativo
    if (permissoes !== undefined) {
      // Array vazio ou null = volta a usar o preset do plano
      atualizacoes.permissoes = Array.isArray(permissoes) && permissoes.length > 0 ? permissoes : null
    }
    if (senha) {
      atualizacoes.senha = await bcrypt.hash(senha, 10)
    }

    await conta.update(atualizacoes)

    const data = conta.toJSON()
    delete data.senha
    data.permissoesEfetivas = permissoesEfetivas(conta)

    res.json({ sucesso: true, mensagem: 'Conta atualizada!', data })
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: erro.message })
  }
}

// Exclui permanentemente a conta e TODOS os dados vinculados a ela.
// Ação destrutiva e irreversível — usada quando o assinante pede o
// cancelamento definitivo (ex: exigência de LGPD/direito ao esquecimento).
export const deletarConta = async (req, res) => {
  try {
    const conta = await Veterinario.findByPk(req.params.id)
    if (!conta) return res.status(404).json({ sucesso: false, erro: 'Conta não encontrada' })

    if (conta.id === req.veterinario.id) {
      return res.status(400).json({ sucesso: false, erro: 'Você não pode excluir a própria conta' })
    }
    if (conta.role === 'admin') {
      return res.status(400).json({ sucesso: false, erro: 'Não é possível excluir uma conta de administrador' })
    }

    const veterinarioId = conta.id

    // Apaga na ordem certa (filhos antes dos pais) para não deixar registros órfãos.
    // Anexo não tem veterinarioId direto — remove pelos agendamentos/históricos do vet.
    const agendamentoIds = (await Agendamento.findAll({ where: { veterinarioId }, attributes: ['id'], paranoid: false })).map(a => a.id)
    const historicoIds = (await HistoricoConsulta.findAll({ where: { veterinarioId }, attributes: ['id'], paranoid: false })).map(h => h.id)

    if (agendamentoIds.length > 0 || historicoIds.length > 0) {
      await Anexo.destroy({
        where: {
          [Op.or]: [
            agendamentoIds.length > 0 ? { agendamentoId: agendamentoIds } : null,
            historicoIds.length > 0 ? { historicoConsultaId: historicoIds } : null
          ].filter(Boolean)
        },
        force: true
      })
    }

    await Faturamento.destroy({ where: { veterinarioId }, force: true })
    await HistoricoConsulta.destroy({ where: { veterinarioId }, force: true })
    await Agendamento.destroy({ where: { veterinarioId }, force: true })
    await Despesa.destroy({ where: { veterinarioId }, force: true })
    await Veiculo.destroy({ where: { veterinarioId }, force: true })
    await Insumo.destroy({ where: { veterinarioId }, force: true })
    await DocumentoEmitido.destroy({ where: { veterinarioId }, force: true })
    await Compartilhamento.destroy({
      where: { [Op.or]: [{ veterinarioOrigemId: veterinarioId }, { veterinarioConvidadoId: veterinarioId }] }
    })
    await Pet.destroy({ where: { veterinarioId }, force: true })
    await Cliente.destroy({ where: { veterinarioId }, force: true })
    await conta.destroy({ force: true })

    res.json({ sucesso: true, mensagem: 'Conta e todos os dados vinculados foram excluídos permanentemente.' })
  } catch (erro) {
    console.error('[ERROR] deletarConta:', erro)
    res.status(500).json({ sucesso: false, erro: erro.message })
  }
}
