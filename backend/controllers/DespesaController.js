import { Despesa } from '../models/index.js'
import { Op } from 'sequelize'

export const listarDespesas = async (req, res) => {
  try {
    // Multi-tenancy: o id vem do token JWT (o :veterinarioId da rota é ignorado)
    const veterinarioId = req.veterinario.id
    const despesas = await Despesa.findAll({
      where: { veterinarioId },
      order: [['data', 'DESC']]
    })
    res.json({ sucesso: true, data: despesas })
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: erro.message })
  }
}

export const resumoDespesas = async (req, res) => {
  try {
    const veterinarioId = req.veterinario.id
    const hoje = new Date()
    const primeiroDocao = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
    const ultimoDiaMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)

    // Despesas do mês
    const despesasMes = await Despesa.findAll({
      where: {
        veterinarioId,
        data: { [Op.between]: [primeiroDocao, ultimoDiaMes] }
      }
    })

    // Despesas do dia
    const despesasHoje = await Despesa.findAll({
      where: {
        veterinarioId,
        data: {
          [Op.between]: [
            new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()),
            new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59)
          ]
        }
      }
    })

    const totalMes = despesasMes.reduce((sum, d) => sum + parseFloat(d.valor || 0), 0)
    const totalHoje = despesasHoje.reduce((sum, d) => sum + parseFloat(d.valor || 0), 0)

    // Agrupar por categoria
    const porCategoria = {}
    despesasMes.forEach(d => {
      if (!porCategoria[d.categoriaDespesa]) {
        porCategoria[d.categoriaDespesa] = 0
      }
      porCategoria[d.categoriaDespesa] += parseFloat(d.valor || 0)
    })

    res.json({
      sucesso: true,
      data: {
        totalMes,
        totalHoje,
        despesasHoje: despesasHoje.length,
        despesasMes: despesasMes.length,
        porCategoria
      }
    })
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: erro.message })
  }
}

export const criarDespesa = async (req, res) => {
  try {
    const { categoriaDespesa, descricao, valor, tipo } = req.body

    if (!categoriaDespesa || !valor) {
      return res.status(400).json({ sucesso: false, erro: 'Categoria e valor são obrigatórios' })
    }

    const despesa = await Despesa.create({
      veterinarioId: req.veterinario.id,
      categoriaDespesa,
      descricao,
      valor,
      tipo
    })

    res.status(201).json({ sucesso: true, mensagem: 'Despesa registrada!', data: despesa })
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: erro.message })
  }
}

export const atualizarDespesa = async (req, res) => {
  try {
    const despesa = await Despesa.findOne({
      where: { id: req.params.id, veterinarioId: req.veterinario.id }
    })
    if (!despesa) return res.status(404).json({ sucesso: false, erro: 'Despesa não encontrada' })

    const dados = { ...req.body }
    delete dados.veterinarioId
    await despesa.update(dados)
    res.json({ sucesso: true, mensagem: 'Despesa atualizada!', data: despesa })
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: erro.message })
  }
}

export const deletarDespesa = async (req, res) => {
  try {
    const despesa = await Despesa.findOne({
      where: { id: req.params.id, veterinarioId: req.veterinario.id }
    })
    if (!despesa) return res.status(404).json({ sucesso: false, erro: 'Despesa não encontrada' })

    await despesa.destroy()
    res.json({ sucesso: true, mensagem: 'Despesa deletada!' })
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: erro.message })
  }
}
