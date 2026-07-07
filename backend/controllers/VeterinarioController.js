import { Veterinario } from '../models/index.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import { permissoesEfetivas } from '../config/planos.js'

dotenv.config()

const JWT_SECRET = process.env.JWT_SECRET || 'sua-chave-secreta-super-segura-aqui'

// Códigos de recuperação de senha (em memória, expiram em 15 minutos)
const codigosReset = new Map() // emailLowerCase -> { codigo, expira }

// Solicitar código de recuperação de senha (rota pública).
// O código é gerado/validado no servidor; a entrega ao usuário é via WhatsApp (frontend).
export const esqueciSenha = async (req, res) => {
  try {
    const { email } = req.body
    if (!email) {
      return res.status(400).json({ sucesso: false, erro: 'Email é obrigatório' })
    }

    const veterinario = await Veterinario.findOne({ where: { email } })
    if (!veterinario) {
      return res.status(404).json({ sucesso: false, erro: 'Email não cadastrado no sistema' })
    }

    const codigo = Math.floor(100000 + Math.random() * 900000).toString()
    codigosReset.set(email.toLowerCase(), { codigo, expira: Date.now() + 15 * 60 * 1000 })

    res.json({ sucesso: true, mensagem: 'Código gerado com sucesso', data: { codigo } })
  } catch (erro) {
    console.error('[ERROR] esqueciSenha:', erro)
    res.status(500).json({ sucesso: false, erro: erro.message })
  }
}

// Atualizar senha usando o código de recuperação (rota pública)
export const atualizarSenhaComCodigo = async (req, res) => {
  try {
    const { email, codigo, novaSenha } = req.body

    if (!email || !codigo || !novaSenha) {
      return res.status(400).json({ sucesso: false, erro: 'Email, código e nova senha são obrigatórios' })
    }
    if (novaSenha.length < 6) {
      return res.status(400).json({ sucesso: false, erro: 'A senha deve ter no mínimo 6 caracteres' })
    }

    const registro = codigosReset.get(email.toLowerCase())
    if (!registro || registro.codigo !== String(codigo)) {
      return res.status(400).json({ sucesso: false, erro: 'Código inválido' })
    }
    if (Date.now() > registro.expira) {
      codigosReset.delete(email.toLowerCase())
      return res.status(400).json({ sucesso: false, erro: 'Código expirado. Solicite um novo.' })
    }

    const veterinario = await Veterinario.findOne({ where: { email } })
    if (!veterinario) {
      return res.status(404).json({ sucesso: false, erro: 'Conta não encontrada' })
    }

    const senhaHasheada = await bcrypt.hash(novaSenha, 10)
    await veterinario.update({ senha: senhaHasheada })
    codigosReset.delete(email.toLowerCase())

    res.json({ sucesso: true, mensagem: 'Senha atualizada com sucesso!' })
  } catch (erro) {
    console.error('[ERROR] atualizarSenhaComCodigo:', erro)
    res.status(500).json({ sucesso: false, erro: erro.message })
  }
}

export const login = async (req, res) => {
  try {
    const { email, senha } = req.body

    if (!email || !senha) {
      return res.status(400).json({ sucesso: false, erro: 'Email e senha são obrigatórios' })
    }

    const veterinario = await Veterinario.findOne({ where: { email } })

    if (!veterinario) {
      return res.status(401).json({ sucesso: false, erro: 'Email ou senha incorretos' })
    }

    const senhaValida = await bcrypt.compare(senha, veterinario.senha)

    if (!senhaValida) {
      return res.status(401).json({ sucesso: false, erro: 'Email ou senha incorretos' })
    }

    // Controle de assinatura: conta suspensa não entra
    if (!veterinario.ativo) {
      return res.status(403).json({ sucesso: false, erro: 'Conta suspensa. Entre em contato com o suporte.' })
    }

    const token = jwt.sign(
      { id: veterinario.id, email: veterinario.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    )

    res.json({
      sucesso: true,
      mensagem: 'Login realizado com sucesso!',
      token,
      veterinario: {
        id: veterinario.id,
        nome: veterinario.nome,
        email: veterinario.email,
        role: veterinario.role || 'vet',
        plano: veterinario.plano || 'basico',
        permissoes: permissoesEfetivas(veterinario)
      }
    })
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: erro.message })
  }
}

// Dados da conta logada (o frontend usa para atualizar permissões sem novo login)
export const contaAtual = async (req, res) => {
  res.json({
    sucesso: true,
    data: {
      id: req.veterinario.id,
      nome: req.veterinario.nome,
      email: req.veterinario.email,
      role: req.veterinario.role,
      plano: req.veterinario.plano,
      permissoes: req.veterinario.permissoes
    }
  })
}

// Multi-tenancy: cada veterinário só enxerga e gerencia a própria conta

export const listarVeterinarios = async (req, res) => {
  try {
    // Retorna apenas a própria conta (não expor outros tenants)
    const veterinarios = await Veterinario.findAll({
      where: { id: req.veterinario.id },
      attributes: { exclude: ['senha'] }
    })
    const safeData = veterinarios.map(v => {
      const obj = v.toJSON()
      delete obj.senha
      return obj
    })
    res.json({ sucesso: true, data: safeData })
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: erro.message })
  }
}

export const obterVeterinario = async (req, res) => {
  try {
    if (parseInt(req.params.id) !== req.veterinario.id) {
      return res.status(403).json({ sucesso: false, erro: 'Acesso negado' })
    }
    const veterinario = await Veterinario.findByPk(req.veterinario.id, {
      attributes: { exclude: ['senha'] }
    })
    if (!veterinario) return res.status(404).json({ sucesso: false, erro: 'Veterinário não encontrado' })
    const safeData = veterinario.toJSON()
    delete safeData.senha
    res.json({ sucesso: true, data: safeData })
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: erro.message })
  }
}

export const criarVeterinario = async (req, res) => {
  try {
    const { nome, email, senha, telefone, cpf, crmv } = req.body

    if (!nome || !email || !senha) {
      return res.status(400).json({ sucesso: false, erro: 'Nome, email e senha são obrigatórios' })
    }

    const senhaHasheada = await bcrypt.hash(senha, 10)

    const veterinario = await Veterinario.create({
      nome,
      email,
      senha: senhaHasheada,
      telefone,
      cpf,
      crmv
    })

    const safeData = veterinario.toJSON()
    delete safeData.senha
    res.status(201).json({ sucesso: true, mensagem: 'Veterinário criado!', data: safeData })
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: erro.message })
  }
}

export const atualizarVeterinario = async (req, res) => {
  try {
    if (parseInt(req.params.id) !== req.veterinario.id) {
      return res.status(403).json({ sucesso: false, erro: 'Acesso negado' })
    }
    const veterinario = await Veterinario.findByPk(req.veterinario.id)
    if (!veterinario) return res.status(404).json({ sucesso: false, erro: 'Veterinário não encontrado' })

    const dadosAtualizacao = { ...req.body }
    if (dadosAtualizacao.senha) {
      dadosAtualizacao.senha = await bcrypt.hash(dadosAtualizacao.senha, 10)
    }

    await veterinario.update(dadosAtualizacao)
    // Remover senha da resposta
    const safeData = veterinario.toJSON()
    delete safeData.senha
    res.json({ sucesso: true, mensagem: 'Veterinário atualizado!', data: safeData })
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: erro.message })
  }
}

export const deletarVeterinario = async (req, res) => {
  try {
    if (parseInt(req.params.id) !== req.veterinario.id) {
      return res.status(403).json({ sucesso: false, erro: 'Acesso negado' })
    }
    const veterinario = await Veterinario.findByPk(req.veterinario.id)
    if (!veterinario) return res.status(404).json({ sucesso: false, erro: 'Veterinário não encontrado' })

    await veterinario.destroy()
    res.json({ sucesso: true, mensagem: 'Veterinário deletado!' })
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: erro.message })
  }
}
