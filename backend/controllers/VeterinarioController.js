import { Veterinario } from '../models/index.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

dotenv.config()

const JWT_SECRET = process.env.JWT_SECRET || 'sua-chave-secreta-super-segura-aqui'

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
        email: veterinario.email
      }
    })
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: erro.message })
  }
}

export const listarVeterinarios = async (req, res) => {
  try {
    const veterinarios = await Veterinario.findAll({
      attributes: { exclude: ['senha'] }
    })
    res.json({ sucesso: true, data: veterinarios })
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: erro.message })
  }
}

export const obterVeterinario = async (req, res) => {
  try {
    const veterinario = await Veterinario.findByPk(req.params.id, {
      attributes: { exclude: ['senha'] }
    })
    if (!veterinario) return res.status(404).json({ sucesso: false, erro: 'Veterinário não encontrado' })
    res.json({ sucesso: true, data: veterinario })
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

    res.status(201).json({ sucesso: true, mensagem: 'Veterinário criado!', data: veterinario })
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: erro.message })
  }
}

export const atualizarVeterinario = async (req, res) => {
  try {
    const veterinario = await Veterinario.findByPk(req.params.id)
    if (!veterinario) return res.status(404).json({ sucesso: false, erro: 'Veterinário não encontrado' })

    const dadosAtualizacao = { ...req.body }
    if (dadosAtualizacao.senha) {
      dadosAtualizacao.senha = await bcrypt.hash(dadosAtualizacao.senha, 10)
    }

    await veterinario.update(dadosAtualizacao)
    res.json({ sucesso: true, mensagem: 'Veterinário atualizado!', data: veterinario })
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: erro.message })
  }
}

export const deletarVeterinario = async (req, res) => {
  try {
    const veterinario = await Veterinario.findByPk(req.params.id)
    if (!veterinario) return res.status(404).json({ sucesso: false, erro: 'Veterinário não encontrado' })

    await veterinario.destroy()
    res.json({ sucesso: true, mensagem: 'Veterinário deletado!' })
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: erro.message })
  }
}
