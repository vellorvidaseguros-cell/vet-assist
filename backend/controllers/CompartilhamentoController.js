import { Compartilhamento, Pet, Veterinario, Cliente } from '../models/index.js'
import crypto from 'crypto'

// Criar um convite de compartilhamento
export const criarCompartilhamento = async (req, res) => {
  try {
    const { animalId } = req.params
    const { emailConvidado, veterinarioConvidadoId, permissoes } = req.body
    const veterinarioOrigemId = req.veterinario.id

    // Validar que o animal pertence ao vet que está criando o compartilhamento
    const animal = await Pet.findOne({
      where: { id: animalId, veterinarioId: veterinarioOrigemId }
    })
    if (!animal) {
      return res.status(404).json({
        sucesso: false,
        erro: 'Animal não encontrado ou não pertence a você'
      })
    }

    // Se for convidar um vet existente, validar que ele existe
    if (veterinarioConvidadoId) {
      const vetConvidado = await Veterinario.findByPk(veterinarioConvidadoId)
      if (!vetConvidado) {
        return res.status(404).json({
          sucesso: false,
          erro: 'Veterinário convidado não encontrado'
        })
      }
    }

    // Se veio só o email, tentar vincular a um vet já cadastrado — assim o
    // convite aparece direto dentro do app dele (sem precisar do link).
    let convidadoIdFinal = veterinarioConvidadoId || null
    if (!convidadoIdFinal && emailConvidado) {
      const vetPorEmail = await Veterinario.findOne({
        where: { email: emailConvidado.trim().toLowerCase() }
      })
      if (vetPorEmail) convidadoIdFinal = vetPorEmail.id
    }

    // Não permitir compartilhar consigo mesmo
    if (convidadoIdFinal && convidadoIdFinal === veterinarioOrigemId) {
      return res.status(400).json({
        sucesso: false,
        erro: 'Você não pode compartilhar um animal com você mesmo'
      })
    }

    // Gerar token único
    const token = crypto.randomBytes(16).toString('hex')

    const compartilhamento = await Compartilhamento.create({
      animalId,
      veterinarioOrigemId,
      veterinarioConvidadoId: convidadoIdFinal,
      emailConvidado: emailConvidado ? emailConvidado.trim().toLowerCase() : null,
      permissoes: permissoes || ['ver'],
      token,
      status: 'pendente'
    })

    res.status(201).json({
      sucesso: true,
      mensagem: convidadoIdFinal
        ? 'Convite enviado! Ele já aparece dentro do app do veterinário convidado.'
        : 'Convite criado! Envie o link para o veterinário se cadastrar e aceitar.',
      data: {
        id: compartilhamento.id,
        token,
        vinculadoAppConvidado: !!convidadoIdFinal,
        linkConvite: `/compartilhamento/aceitar?token=${token}`
      }
    })
  } catch (erro) {
    console.error('[ERROR] criarCompartilhamento:', erro)
    res.status(500).json({ sucesso: false, erro: erro.message })
  }
}

// Listar compartilhamentos de um animal (quem tem acesso)
export const listarCompartilhamentos = async (req, res) => {
  try {
    const { animalId } = req.params
    const veterinarioId = req.veterinario.id

    // Validar que o animal pertence ao vet
    const animal = await Pet.findOne({
      where: { id: animalId, veterinarioId }
    })
    if (!animal) {
      return res.status(404).json({
        sucesso: false,
        erro: 'Animal não encontrado'
      })
    }

    const compartilhamentos = await Compartilhamento.findAll({
      where: { animalId },
      include: [
        {
          model: Veterinario,
          as: 'veterinarioConvidado',
          attributes: ['id', 'nome', 'email'],
          required: false
        }
      ]
    })

    res.json({ sucesso: true, data: compartilhamentos })
  } catch (erro) {
    console.error('[ERROR] listarCompartilhamentos:', erro)
    res.status(500).json({ sucesso: false, erro: erro.message })
  }
}

// Ver proposta de compartilhamento (link público, sem autenticação)
export const verPropostaPublica = async (req, res) => {
  try {
    const { token } = req.params

    const compartilhamento = await Compartilhamento.findOne({
      where: { token, status: 'pendente' }
    })
    if (!compartilhamento) {
      return res.status(404).json({
        sucesso: false,
        erro: 'Convite inválido ou já expirado'
      })
    }

    const animal = await Pet.findByPk(compartilhamento.animalId, {
      include: [{ model: Cliente, attributes: ['id', 'nome'] }]
    })
    const vetOrigem = await Veterinario.findByPk(compartilhamento.veterinarioOrigemId, {
      attributes: ['id', 'nome', 'nomeClinica', 'email']
    })

    res.json({
      sucesso: true,
      data: {
        token,
        animal: animal ? { id: animal.id, nome: animal.nome, especie: animal.especie } : null,
        cliente: animal?.Cliente || null,
        vetOrigem,
        permissoes: compartilhamento.permissoes,
        emailConvidado: compartilhamento.emailConvidado
      }
    })
  } catch (erro) {
    console.error('[ERROR] verPropostaPublica:', erro)
    res.status(500).json({ sucesso: false, erro: erro.message })
  }
}

// Aceitar compartilhamento (com ou sem criar conta)
export const aceitarCompartilhamento = async (req, res) => {
  try {
    const { token } = req.params
    const { novoVeterinario } = req.body

    const compartilhamento = await Compartilhamento.findOne({
      where: { token, status: 'pendente' }
    })
    if (!compartilhamento) {
      return res.status(404).json({
        sucesso: false,
        erro: 'Convite inválido ou já expirado'
      })
    }

    let veterinarioConvidadoId = compartilhamento.veterinarioConvidadoId

    // Se não houver veterinarioConvidadoId, criar uma nova conta
    if (!veterinarioConvidadoId && novoVeterinario) {
      const { nome, email, senha } = novoVeterinario

      // Validar dados obrigatórios
      if (!nome || !email || !senha) {
        return res.status(400).json({
          sucesso: false,
          erro: 'Nome, email e senha são obrigatórios'
        })
      }

      // Validar se email já existe
      const emailExistente = await Veterinario.findOne({ where: { email } })
      if (emailExistente) {
        return res.status(400).json({
          sucesso: false,
          erro: 'Email já cadastrado'
        })
      }

      // Criar nova conta
      const bcryptjs = await import('bcryptjs').then(m => m.default)
      const senhaHasheada = await bcryptjs.hash(senha, 10)

      const novoVet = await Veterinario.create({
        nome,
        email,
        senha: senhaHasheada,
        role: 'vet',
        plano: 'basico'
      })

      veterinarioConvidadoId = novoVet.id
    } else if (!veterinarioConvidadoId) {
      // Se está logado, usar o ID do token
      if (!req.veterinario) {
        return res.status(401).json({
          sucesso: false,
          erro: 'Autenticação necessária ou dados de novo veterinário obrigatórios'
        })
      }
      veterinarioConvidadoId = req.veterinario.id
    } else if (req.veterinario && req.veterinario.id !== veterinarioConvidadoId) {
      // Se está logado com outra conta, validar
      return res.status(403).json({
        sucesso: false,
        erro: 'Este convite é para outro usuário'
      })
    }

    // Atualizar compartilhamento
    await compartilhamento.update({
      veterinarioConvidadoId,
      status: 'aceito',
      aceitoEm: new Date()
    })

    res.json({
      sucesso: true,
      mensagem: 'Compartilhamento aceito com sucesso!',
      data: { compartilhamentoId: compartilhamento.id }
    })
  } catch (erro) {
    console.error('[ERROR] aceitarCompartilhamento:', erro)
    res.status(500).json({ sucesso: false, erro: erro.message })
  }
}

// Listar todos os compartilhamentos criados por mim (VetA vê quem tem acesso)
export const listarMeusCompartilhamentos = async (req, res) => {
  try {
    const veterinarioId = req.veterinario.id

    const compartilhamentos = await Compartilhamento.findAll({
      where: { veterinarioOrigemId: veterinarioId },
      include: [
        {
          model: Pet,
          attributes: ['id', 'nome', 'especie'],
          required: false
        },
        {
          model: Veterinario,
          as: 'veterinarioConvidado',
          attributes: ['id', 'nome', 'email'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']]
    })

    res.json({ sucesso: true, data: compartilhamentos })
  } catch (erro) {
    console.error('[ERROR] listarMeusCompartilhamentos:', erro)
    res.status(500).json({ sucesso: false, erro: erro.message })
  }
}

// Listar animais compartilhados comigo
export const listarCompartilhadosComigo = async (req, res) => {
  try {
    const veterinarioId = req.veterinario.id

    const compartilhamentos = await Compartilhamento.findAll({
      where: {
        veterinarioConvidadoId: veterinarioId,
        status: 'aceito'
      },
      include: [
        {
          model: Pet,
          attributes: ['id', 'nome', 'especie', 'raca']
        },
        {
          model: Veterinario,
          as: 'veterinarioOrigem',
          attributes: ['id', 'nome', 'nomeClinica'],
          required: false
        }
      ]
    })

    res.json({ sucesso: true, data: compartilhamentos })
  } catch (erro) {
    console.error('[ERROR] listarCompartilhadosComigo:', erro)
    res.status(500).json({ sucesso: false, erro: erro.message })
  }
}

// Listar convites PENDENTES destinados a mim (VetB) — por id vinculado ou pelo email.
// É o que alimenta a aba "Convites recebidos" dentro do app.
export const listarConvitesRecebidos = async (req, res) => {
  try {
    const { Op } = await import('sequelize')
    const veterinarioId = req.veterinario.id
    const meuEmail = (req.veterinario.email || '').trim().toLowerCase()

    const filtros = [{ veterinarioConvidadoId: veterinarioId }]
    if (meuEmail) {
      // Convites que vieram só por email e ainda não foram vinculados a ninguém
      filtros.push({ emailConvidado: meuEmail, veterinarioConvidadoId: null })
    }

    const convites = await Compartilhamento.findAll({
      where: { status: 'pendente', [Op.or]: filtros },
      include: [
        { model: Pet, attributes: ['id', 'nome', 'especie', 'raca'], required: false },
        {
          model: Veterinario,
          as: 'veterinarioOrigem',
          attributes: ['id', 'nome', 'nomeClinica'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']]
    })

    res.json({ sucesso: true, data: convites })
  } catch (erro) {
    console.error('[ERROR] listarConvitesRecebidos:', erro)
    res.status(500).json({ sucesso: false, erro: erro.message })
  }
}

// Aceitar um convite pelo ID, estando logado (VetB dentro do app)
export const aceitarConvitePorId = async (req, res) => {
  try {
    const { id } = req.params
    const veterinarioId = req.veterinario.id
    const meuEmail = (req.veterinario.email || '').trim().toLowerCase()

    const convite = await Compartilhamento.findOne({ where: { id, status: 'pendente' } })
    if (!convite) {
      return res.status(404).json({ sucesso: false, erro: 'Convite não encontrado ou já respondido' })
    }

    // Só pode aceitar quem é o destinatário (por id ou por email)
    const ehDestinatario =
      convite.veterinarioConvidadoId === veterinarioId ||
      (!convite.veterinarioConvidadoId && convite.emailConvidado === meuEmail)
    if (!ehDestinatario) {
      return res.status(403).json({ sucesso: false, erro: 'Este convite não é para você' })
    }

    await convite.update({
      veterinarioConvidadoId: veterinarioId,
      status: 'aceito',
      aceitoEm: new Date()
    })

    res.json({ sucesso: true, mensagem: 'Convite aceito! O animal já está disponível para você.' })
  } catch (erro) {
    console.error('[ERROR] aceitarConvitePorId:', erro)
    res.status(500).json({ sucesso: false, erro: erro.message })
  }
}

// Recusar um convite pelo ID (VetB dentro do app)
export const recusarConvitePorId = async (req, res) => {
  try {
    const { id } = req.params
    const veterinarioId = req.veterinario.id
    const meuEmail = (req.veterinario.email || '').trim().toLowerCase()

    const convite = await Compartilhamento.findOne({ where: { id, status: 'pendente' } })
    if (!convite) {
      return res.status(404).json({ sucesso: false, erro: 'Convite não encontrado ou já respondido' })
    }

    const ehDestinatario =
      convite.veterinarioConvidadoId === veterinarioId ||
      (!convite.veterinarioConvidadoId && convite.emailConvidado === meuEmail)
    if (!ehDestinatario) {
      return res.status(403).json({ sucesso: false, erro: 'Este convite não é para você' })
    }

    // Remove o convite recusado (é soft-delete se o model for paranoid; senão apaga)
    await convite.destroy()

    res.json({ sucesso: true, mensagem: 'Convite recusado.' })
  } catch (erro) {
    console.error('[ERROR] recusarConvitePorId:', erro)
    res.status(500).json({ sucesso: false, erro: erro.message })
  }
}

// Revogar acesso a um compartilhamento
export const revogarCompartilhamento = async (req, res) => {
  try {
    const { animalId, compartilhamentoId } = req.params
    const veterinarioId = req.veterinario.id

    // Validar que o animal pertence ao vet
    const animal = await Pet.findOne({
      where: { id: animalId, veterinarioId }
    })
    if (!animal) {
      return res.status(404).json({
        sucesso: false,
        erro: 'Animal não encontrado'
      })
    }

    const compartilhamento = await Compartilhamento.findOne({
      where: { id: compartilhamentoId, animalId }
    })
    if (!compartilhamento) {
      return res.status(404).json({
        sucesso: false,
        erro: 'Compartilhamento não encontrado'
      })
    }

    await compartilhamento.destroy()

    res.json({
      sucesso: true,
      mensagem: 'Acesso revogado com sucesso!'
    })
  } catch (erro) {
    console.error('[ERROR] revogarCompartilhamento:', erro)
    res.status(500).json({ sucesso: false, erro: erro.message })
  }
}
