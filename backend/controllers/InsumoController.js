import { Insumo } from '../models/index.js'

export const listarInsumos = async (req, res) => {
  try {
    const insumos = await Insumo.findAll({
      where: { veterinarioId: req.veterinario.id },
      order: [['nome', 'ASC']]
    })
    res.json({ sucesso: true, data: insumos })
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: erro.message })
  }
}

export const criarInsumo = async (req, res) => {
  try {
    const { nome, unidade, quantidadeEstoque, quantidadeMinima, custoUnitario, precoVenda } = req.body

    if (!nome || !nome.trim()) {
      return res.status(400).json({ sucesso: false, erro: 'Nome do insumo é obrigatório' })
    }

    const insumo = await Insumo.create({
      veterinarioId: req.veterinario.id,
      nome: nome.trim(),
      unidade: unidade || 'un',
      quantidadeEstoque: quantidadeEstoque || 0,
      quantidadeMinima: quantidadeMinima || 0,
      custoUnitario: custoUnitario || 0,
      precoVenda: precoVenda || 0,
    })

    res.status(201).json({ sucesso: true, mensagem: 'Insumo cadastrado!', data: insumo })
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: erro.message })
  }
}

export const atualizarInsumo = async (req, res) => {
  try {
    const insumo = await Insumo.findOne({
      where: { id: req.params.id, veterinarioId: req.veterinario.id }
    })
    if (!insumo) return res.status(404).json({ sucesso: false, erro: 'Insumo não encontrado' })

    const dados = { ...req.body }
    delete dados.veterinarioId
    await insumo.update(dados)

    res.json({ sucesso: true, mensagem: 'Insumo atualizado!', data: insumo })
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: erro.message })
  }
}

export const deletarInsumo = async (req, res) => {
  try {
    const insumo = await Insumo.findOne({
      where: { id: req.params.id, veterinarioId: req.veterinario.id }
    })
    if (!insumo) return res.status(404).json({ sucesso: false, erro: 'Insumo não encontrado' })

    await insumo.destroy()
    res.json({ sucesso: true, mensagem: 'Insumo removido!' })
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: erro.message })
  }
}

// Abate quantidade do estoque quando o insumo é usado em um orçamento/atendimento.
// Não deixa a quantidade ficar negativa (mostra o quanto realmente havia).
export const baixarEstoque = async (req, res) => {
  try {
    const { quantidade } = req.body
    const qtd = parseFloat(quantidade)

    if (!qtd || qtd <= 0) {
      return res.status(400).json({ sucesso: false, erro: 'Quantidade inválida' })
    }

    const insumo = await Insumo.findOne({
      where: { id: req.params.id, veterinarioId: req.veterinario.id }
    })
    if (!insumo) return res.status(404).json({ sucesso: false, erro: 'Insumo não encontrado' })

    const atual = parseFloat(insumo.quantidadeEstoque) || 0
    const novaQuantidade = Math.max(0, atual - qtd)
    await insumo.update({ quantidadeEstoque: novaQuantidade })

    res.json({
      sucesso: true,
      mensagem: 'Estoque atualizado!',
      data: insumo,
      estoqueInsuficiente: atual < qtd
    })
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: erro.message })
  }
}

// Repõe quantidade ao estoque (ex.: quando um insumo é removido de um orçamento
// antes de emitir). É o inverso de baixarEstoque.
export const reporEstoque = async (req, res) => {
  try {
    const { quantidade } = req.body
    const qtd = parseFloat(quantidade)

    if (!qtd || qtd <= 0) {
      return res.status(400).json({ sucesso: false, erro: 'Quantidade inválida' })
    }

    const insumo = await Insumo.findOne({
      where: { id: req.params.id, veterinarioId: req.veterinario.id }
    })
    if (!insumo) return res.status(404).json({ sucesso: false, erro: 'Insumo não encontrado' })

    const atual = parseFloat(insumo.quantidadeEstoque) || 0
    await insumo.update({ quantidadeEstoque: atual + qtd })

    res.json({ sucesso: true, mensagem: 'Estoque reposto!', data: insumo })
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: erro.message })
  }
}
