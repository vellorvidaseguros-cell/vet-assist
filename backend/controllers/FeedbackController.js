import { Feedback, Veterinario } from '../models/index.js'

// Qualquer veterinário logado pode enviar dúvida/sugestão/bug
export const enviarFeedback = async (req, res) => {
  try {
    const { tipo, mensagem } = req.body
    if (!mensagem || !mensagem.trim()) {
      return res.status(400).json({ sucesso: false, erro: 'Escreva sua dúvida ou sugestão' })
    }

    const feedback = await Feedback.create({
      veterinarioId: req.veterinario.id,
      tipo: ['duvida', 'sugestao', 'bug'].includes(tipo) ? tipo : 'sugestao',
      mensagem: mensagem.trim(),
      status: 'novo'
    })

    // Avisa em tempo real quem estiver com o admin logado (broadcast; o front
    // filtra por role no cliente, mesmo padrão usado nos lembretes de agendamento)
    if (global.io) {
      global.io.emit('novoFeedback', {
        id: feedback.id,
        tipo: feedback.tipo,
        autorNome: req.veterinario.nome,
        mensagem: feedback.mensagem
      })
    }

    res.status(201).json({ sucesso: true, mensagem: 'Enviado! Obrigado pelo retorno.', data: feedback })
  } catch (erro) {
    console.error('[ERROR] enviarFeedback:', erro)
    res.status(500).json({ sucesso: false, erro: erro.message })
  }
}

// Apenas admin: lista todos os feedbacks recebidos, com nome/e-mail de quem enviou
export const listarFeedbacks = async (req, res) => {
  try {
    if (req.veterinario.role !== 'admin') {
      return res.status(403).json({ sucesso: false, erro: 'Acesso restrito ao administrador' })
    }

    const feedbacks = await Feedback.findAll({
      order: [['createdAt', 'DESC']]
    })

    // Junta nome/e-mail do autor manualmente (sem association formal no projeto)
    const autoresIds = [...new Set(feedbacks.map(f => f.veterinarioId))]
    const autores = await Veterinario.findAll({
      where: { id: autoresIds },
      attributes: ['id', 'nome', 'email']
    })
    const autorPorId = Object.fromEntries(autores.map(a => [a.id, a]))

    const data = feedbacks.map(f => {
      const json = f.toJSON()
      const autor = autorPorId[json.veterinarioId]
      json.autorNome = autor?.nome || 'Desconhecido'
      json.autorEmail = autor?.email || ''
      return json
    })

    res.json({ sucesso: true, data })
  } catch (erro) {
    console.error('[ERROR] listarFeedbacks:', erro)
    res.status(500).json({ sucesso: false, erro: erro.message })
  }
}

// Apenas admin: marca como lido/resolvido
export const atualizarStatusFeedback = async (req, res) => {
  try {
    if (req.veterinario.role !== 'admin') {
      return res.status(403).json({ sucesso: false, erro: 'Acesso restrito ao administrador' })
    }

    const { status } = req.body
    if (!['novo', 'lido', 'resolvido'].includes(status)) {
      return res.status(400).json({ sucesso: false, erro: 'Status inválido' })
    }

    const feedback = await Feedback.findByPk(req.params.id)
    if (!feedback) return res.status(404).json({ sucesso: false, erro: 'Feedback não encontrado' })

    await feedback.update({ status })
    res.json({ sucesso: true, mensagem: 'Status atualizado!', data: feedback })
  } catch (erro) {
    console.error('[ERROR] atualizarStatusFeedback:', erro)
    res.status(500).json({ sucesso: false, erro: erro.message })
  }
}
