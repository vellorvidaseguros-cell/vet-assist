import { Faturamento, HistoricoConsulta, Cliente } from '../models/index.js'
import { Op } from 'sequelize'

export const listarFaturamentos = async (req, res) => {
  try {
    // Tentar com includes, se falhar tentar sem
    let faturamentos
    try {
      faturamentos = await Faturamento.findAll({
        include: [
          { model: Cliente, required: false },
          { model: HistoricoConsulta, required: false }
        ],
        order: [['dataEmissao', 'DESC']]
      })
    } catch (includeError) {
      console.warn('[WARN] Erro ao incluir relações, carregando sem:', includeError.message)
      // Fallback: carregar sem includes
      faturamentos = await Faturamento.findAll({
        order: [['dataEmissao', 'DESC']]
      })
    }
    res.json({ sucesso: true, data: faturamentos })
  } catch (erro) {
    console.error('[ERROR] listarFaturamentos:', erro)
    res.status(500).json({ sucesso: false, erro: erro.message })
  }
}

export const resumoFinanceiro = async (req, res) => {
  try {
    // Retornar resumo padrão se não houver dados
    const resumoPadrao = {
      faturamentoMes: 0,
      atendidosHoje: 0,
      totalFechadoHoje: 0,
      aReceber: 0,
      quantidadeAReceber: 0
    }

    // Tentar carregar dados, mas não falhar se houver erro
    try {
      const todos = await Faturamento.findAll()

      if (!todos || todos.length === 0) {
        return res.json({ sucesso: true, data: resumoPadrao })
      }

      const hoje = new Date()
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
      const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())

      // Filtrar manualmente (mais seguro que Op.between com datas)
      const faturamentoMes = todos.filter(f => {
        if (!f.dataEmissao) return false
        const data = new Date(f.dataEmissao)
        return data >= inicioMes
      })

      const pagamentoHoje = todos.filter(f => {
        if (!f.dataPagamento) return false
        const data = new Date(f.dataPagamento)
        return data.toDateString() === hoje.toDateString()
      })

      const aReceber = todos.filter(f => f.status === 'Pendente')

      // Calcular totais
      const totalMes = faturamentoMes.reduce((sum, f) => {
        const val = parseFloat(f.valor) || 0
        return sum + val
      }, 0)

      const totalHoje = pagamentoHoje.reduce((sum, f) => {
        const val = parseFloat(f.valor) || 0
        return sum + val
      }, 0)

      const totalReceber = aReceber.reduce((sum, f) => {
        const val = parseFloat(f.valor) || 0
        return sum + val
      }, 0)

      res.json({
        sucesso: true,
        data: {
          faturamentoMes: totalMes,
          atendidosHoje: pagamentoHoje.length,
          totalFechadoHoje: totalHoje,
          aReceber: totalReceber,
          quantidadeAReceber: aReceber.length
        }
      })
    } catch (innerError) {
      console.error('[ERROR] Erro ao processar faturamentos:', innerError)
      // Se falhar ao carregar, retornar resumo vazio ao invés de erro
      res.json({ sucesso: true, data: resumoPadrao })
    }
  } catch (erro) {
    console.error('[ERROR] resumoFinanceiro:', erro)
    // Retornar dados padrão ao invés de erro
    res.json({
      sucesso: true,
      data: {
        faturamentoMes: 0,
        atendidosHoje: 0,
        totalFechadoHoje: 0,
        aReceber: 0,
        quantidadeAReceber: 0
      }
    })
  }
}

export const criarFaturamento = async (req, res) => {
  try {
    const { historicoConsultaId, clienteId, valor, status, descricao, numeroNota } = req.body

    const faturamento = await Faturamento.create({
      historicoConsultaId,
      clienteId,
      valor,
      status,
      descricao,
      numeroNota
    })

    res.status(201).json({ sucesso: true, mensagem: 'Faturamento criado!', data: faturamento })
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: erro.message })
  }
}

export const atualizarFaturamento = async (req, res) => {
  try {
    const faturamento = await Faturamento.findByPk(req.params.id)
    if (!faturamento) return res.status(404).json({ sucesso: false, erro: 'Faturamento não encontrado' })

    if (req.body.status === 'Pago' && !faturamento.dataPagamento) {
      req.body.dataPagamento = new Date()
    }

    await faturamento.update(req.body)
    res.json({ sucesso: true, mensagem: 'Faturamento atualizado!', data: faturamento })
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: erro.message })
  }
}

export const registrarPagamento = async (req, res) => {
  try {
    const { faturamentoId, valorPagamento, dataPagamento } = req.body

    if (!faturamentoId || !valorPagamento) {
      return res.status(400).json({
        sucesso: false,
        erro: 'faturamentoId e valorPagamento são obrigatórios'
      })
    }

    const faturamento = await Faturamento.findByPk(faturamentoId)
    if (!faturamento) {
      return res.status(404).json({ sucesso: false, erro: 'Faturamento não encontrado' })
    }

    const valorAtual = parseFloat(faturamento.valorRecebido) || 0
    const novoValorRecebido = valorAtual + parseFloat(valorPagamento)
    const valorTotal = parseFloat(faturamento.valor)

    // Adicionar ao histórico de pagamentos
    const historico = Array.isArray(faturamento.historicoPagamentos) ? faturamento.historicoPagamentos : []
    historico.push({
      data: dataPagamento || new Date().toISOString().split('T')[0],
      valor: parseFloat(valorPagamento)
    })

    console.log('[DEBUG] Histórico antes de salvar:', JSON.stringify(historico))

    // Determinar novo status
    let novoStatus = 'Pendente'
    let dataPagamentoAtualizada = faturamento.dataPagamento

    if (novoValorRecebido >= valorTotal) {
      novoStatus = 'Pago'
      dataPagamentoAtualizada = dataPagamento || new Date()
    } else if (novoValorRecebido > 0) {
      novoStatus = 'Parcialmente Pago'
    }

    // Atualizar faturamento
    const updateData = {
      valorRecebido: novoValorRecebido,
      status: novoStatus,
      dataUltimoPagamento: dataPagamento || new Date(),
      dataPagamento: dataPagamentoAtualizada,
      historicoPagamentos: historico
    }

    console.log('[DEBUG] Dados a atualizar:', JSON.stringify(updateData))

    await faturamento.update(updateData)

    // Force reload para garantir que temos os dados atualizados
    console.log('[DEBUG] Recarregando faturamento...')
    await faturamento.reload()

    // Recarregar para garantir dados atualizados
    await faturamento.reload({
      include: [
        { model: Cliente, required: false },
        { model: HistoricoConsulta, required: false }
      ]
    })

    res.json({
      sucesso: true,
      mensagem: 'Pagamento registrado com sucesso!',
      data: faturamento
    })
  } catch (erro) {
    console.error('[ERROR] registrarPagamento:', erro)
    res.status(500).json({ sucesso: false, erro: erro.message })
  }
}

export const deletarPagamento = async (req, res) => {
  try {
    const { id, index } = req.params
    const faturamentoId = parseInt(id)
    const paymentIndex = parseInt(index)

    if (isNaN(faturamentoId) || isNaN(paymentIndex)) {
      return res.status(400).json({ sucesso: false, erro: 'IDs inválidos' })
    }

    const faturamento = await Faturamento.findByPk(faturamentoId)
    if (!faturamento) {
      return res.status(404).json({ sucesso: false, erro: 'Faturamento não encontrado' })
    }

    // Obter histórico de pagamentos
    const historico = Array.isArray(faturamento.historicoPagamentos)
      ? faturamento.historicoPagamentos
      : []

    if (paymentIndex < 0 || paymentIndex >= historico.length) {
      return res.status(400).json({ sucesso: false, erro: 'Pagamento não encontrado' })
    }

    // Remover pagamento do índice especificado
    const pagamentoRemovido = historico[paymentIndex]
    historico.splice(paymentIndex, 1)

    // Recalcular valorRecebido
    const novoValorRecebido = historico.reduce((sum, p) => sum + parseFloat(p.valor || 0), 0)
    const valorTotal = parseFloat(faturamento.valor)

    // Determinar novo status
    let novoStatus = 'Pendente'
    if (novoValorRecebido >= valorTotal) {
      novoStatus = 'Pago'
    } else if (novoValorRecebido > 0) {
      novoStatus = 'Parcialmente Pago'
    }

    console.log('[DEBUG] Deletando pagamento:', pagamentoRemovido)
    console.log('[DEBUG] Novo valorRecebido:', novoValorRecebido)

    // Atualizar faturamento
    await faturamento.update({
      valorRecebido: novoValorRecebido,
      status: novoStatus,
      historicoPagamentos: historico
    })

    await faturamento.reload()

    res.json({
      sucesso: true,
      mensagem: 'Pagamento deletado com sucesso!',
      data: faturamento
    })
  } catch (erro) {
    console.error('[ERROR] deletarPagamento:', erro)
    res.status(500).json({ sucesso: false, erro: erro.message })
  }
}

export const apagarTodos = async (req, res) => {
  try {
    const count = await Faturamento.destroy({ where: {} })
    res.json({ sucesso: true, mensagem: `${count} faturamentos apagados com sucesso!`, count })
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: erro.message })
  }
}
