import { HistoricoConsulta, Pet, Cliente, Agendamento, Faturamento } from '../models/index.js'

export const listarHistorico = async (req, res) => {
  try {
    const historico = await HistoricoConsulta.findAll({
      include: [Pet, Cliente],
      order: [['data', 'DESC']]
    })
    res.json({ sucesso: true, data: historico })
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: erro.message })
  }
}

export const historicoDoAnimal = async (req, res) => {
  try {
    const { petId } = req.params
    const historico = await HistoricoConsulta.findAll({
      where: { petId, status: 'Concluído' },
      include: [Pet, Cliente],
      order: [['data', 'DESC']]
    })
    res.json({ sucesso: true, data: historico })
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: erro.message })
  }
}

export const criarHistorico = async (req, res) => {
  try {
    const { agendamentoId, petId, clienteId, data, tipoAtendimento, diagnostico, procedimentos, medicamentos, observacoes, proximoRetorno, veterinario, valor, statusPagamento } = req.body

    let historicoData = {
      petId: petId || null,
      clienteId: clienteId || null,
      data: data || null,
      tipoAtendimento: tipoAtendimento || '',
      diagnostico: diagnostico || '',
      procedimentos: procedimentos || '',
      medicamentos: medicamentos || '',
      observacoes: observacoes || '',
      proximoRetorno: proximoRetorno || null,
      veterinario: veterinario || 'Sistema',
      valor: valor || 0,
      statusPagamento: statusPagamento || 'Pendente'
    }

    // Se agendamentoId foi fornecido, buscar dados do agendamento
    if (agendamentoId) {
      const agendamento = await Agendamento.findByPk(agendamentoId)
      if (!agendamento) {
        return res.status(404).json({ sucesso: false, erro: 'Agendamento não encontrado' })
      }

      // Usar dados do agendamento se não foram fornecidos
      historicoData.petId = historicoData.petId || agendamento.petId
      historicoData.clienteId = historicoData.clienteId || agendamento.clienteId
      historicoData.data = historicoData.data || agendamento.data
      historicoData.tipoAtendimento = historicoData.tipoAtendimento || agendamento.tipoAtendimento
      historicoData.observacoes = historicoData.observacoes || agendamento.observacoes || ''
    }

    // Validar campos obrigatórios
    if (!historicoData.petId || !historicoData.clienteId || !historicoData.data) {
      return res.status(400).json({ sucesso: false, erro: 'Dados incompletos. Preencha petId, clienteId e data.' })
    }

    const historico = await HistoricoConsulta.create(historicoData)

    // Se houver proximoRetorno, criar agendamento automaticamente
    if (historicoData.proximoRetorno) {
      try {
        const dataRetorno = new Date(historicoData.proximoRetorno)
        const horaRetorno = dataRetorno.toTimeString().split(' ')[0].substring(0, 5) // HH:MM

        await Agendamento.create({
          petId: historicoData.petId,
          clienteId: historicoData.clienteId,
          data: historicoData.proximoRetorno,
          hora: horaRetorno || '10:00',
          tipoAtendimento: `Retorno - ${historicoData.tipoAtendimento || 'Consulta'}`,
          observacoes: `Retorno agendado automaticamente. Consulta anterior: ${new Date(historicoData.data).toLocaleDateString('pt-BR')}`,
          status: 'Pendente'
        })
        console.log(`[INFO] Agendamento de retorno criado para ${new Date(historicoData.proximoRetorno).toLocaleDateString('pt-BR')}`)
      } catch (erroAgend) {
        console.error('[WARNING] Erro ao criar agendamento de retorno:', erroAgend.message)
        // Não falha a requisição, apenas loga o aviso
      }
    }

    res.status(201).json({ sucesso: true, mensagem: 'Consulta registrada!', data: historico })
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: erro.message })
  }
}

export const atualizarHistorico = async (req, res) => {
  try {
    const historico = await HistoricoConsulta.findByPk(req.params.id)
    if (!historico) return res.status(404).json({ sucesso: false, erro: 'Histórico não encontrado' })

    const proximoRetornoAnterior = historico.proximoRetorno
    await historico.update(req.body)

    // Se proximoRetorno foi adicionado ou alterado, criar agendamento automaticamente
    if (req.body.proximoRetorno && (!proximoRetornoAnterior || new Date(proximoRetornoAnterior).getTime() !== new Date(req.body.proximoRetorno).getTime())) {
      try {
        const dataRetorno = new Date(req.body.proximoRetorno)
        const horaRetorno = dataRetorno.toTimeString().split(' ')[0].substring(0, 5) // HH:MM

        await Agendamento.create({
          petId: historico.petId,
          clienteId: historico.clienteId,
          data: req.body.proximoRetorno,
          hora: horaRetorno || '10:00',
          tipoAtendimento: `Retorno - ${historico.tipoAtendimento || 'Consulta'}`,
          observacoes: `Retorno agendado automaticamente. Consulta anterior: ${new Date(historico.data).toLocaleDateString('pt-BR')}`,
          status: 'Pendente'
        })
        console.log(`[INFO] Agendamento de retorno criado para ${new Date(req.body.proximoRetorno).toLocaleDateString('pt-BR')}`)
      } catch (erroAgend) {
        console.error('[WARNING] Erro ao criar agendamento de retorno:', erroAgend.message)
        // Não falha a requisição, apenas loga o aviso
      }
    }

    res.json({ sucesso: true, mensagem: 'Histórico atualizado!', data: historico })
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: erro.message })
  }
}

export const deletarHistorico = async (req, res) => {
  try {
    const historico = await HistoricoConsulta.findByPk(req.params.id)
    if (!historico) return res.status(404).json({ sucesso: false, erro: 'Histórico não encontrado' })

    // Deletar Faturamentos associados primeiro
    await Faturamento.destroy({
      where: { historicoConsultaId: historico.id }
    })

    await historico.destroy()
    res.json({ sucesso: true, mensagem: 'Histórico e faturamentos deletados!' })
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: erro.message })
  }
}

export const apagarTodos = async (req, res) => {
  try {
    // Deletar Faturamentos primeiro
    await Faturamento.destroy({ where: {} })
    // Depois deletar Históricos
    const count = await HistoricoConsulta.destroy({ where: {} })
    res.json({ sucesso: true, mensagem: `${count} históricos e seus faturamentos apagados com sucesso!`, count })
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: erro.message })
  }
}
