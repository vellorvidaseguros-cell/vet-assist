import { Aviso, Veterinario } from '../models/index.js'

// Apenas admin: cria e transmite um aviso pra todos os veterinários conectados
export const criarAviso = async (req, res) => {
  try {
    if (req.veterinario.role !== 'admin') {
      return res.status(403).json({ sucesso: false, erro: 'Acesso restrito ao administrador' })
    }

    const { mensagem } = req.body
    if (!mensagem || !mensagem.trim()) {
      return res.status(400).json({ sucesso: false, erro: 'Escreva o aviso' })
    }

    const aviso = await Aviso.create({
      autorId: req.veterinario.id,
      mensagem: mensagem.trim()
    })

    if (global.io) {
      global.io.emit('novoAviso', {
        id: aviso.id,
        mensagem: aviso.mensagem,
        createdAt: aviso.createdAt
      })
    }

    res.status(201).json({ sucesso: true, mensagem: 'Aviso enviado!', data: aviso })
  } catch (erro) {
    console.error('[ERROR] criarAviso:', erro)
    res.status(500).json({ sucesso: false, erro: erro.message })
  }
}

// Qualquer veterinário logado: lista os avisos, mais recente primeiro
export const listarAvisos = async (req, res) => {
  try {
    const avisos = await Aviso.findAll({
      order: [['createdAt', 'DESC']],
      limit: 30
    })

    const autoresIds = [...new Set(avisos.map(a => a.autorId))]
    const autores = await Veterinario.findAll({
      where: { id: autoresIds },
      attributes: ['id', 'nome']
    })
    const autorPorId = Object.fromEntries(autores.map(a => [a.id, a]))

    const data = avisos.map(a => {
      const json = a.toJSON()
      json.autorNome = autorPorId[json.autorId]?.nome || 'Equipe VetAssist'
      return json
    })

    res.json({ sucesso: true, data })
  } catch (erro) {
    console.error('[ERROR] listarAvisos:', erro)
    res.status(500).json({ sucesso: false, erro: erro.message })
  }
}
