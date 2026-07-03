import { HistoricoConsulta, Pet, Cliente, Agendamento, Faturamento, Anexo } from '../models/index.js'

// Helper para formatar URLs de anexos
const formatarUrlAnexo = (anexo) => {
  let url = anexo.caminhoArquivo
  if (url.includes('\\')) {
    url = url.replace(/\\/g, '/')
  }
  if (/^[a-zA-Z]:/.test(url)) {
    const idx = url.indexOf('backend/')
    if (idx !== -1) url = '/' + url.substring(idx)
  }
  if (!url.startsWith('/')) url = '/' + url
  return { ...anexo.toJSON(), caminhoArquivo: url }
}

export const listarHistorico = async (req, res) => {
  try {
    const historico = await HistoricoConsulta.findAll({
      include: [Pet, Cliente, Anexo],
      order: [['data', 'DESC']]
    })
    // Formatar URLs dos anexos
    const historicoFormatado = historico.map(h => {
      const json = h.toJSON()
      if (json.Anexos) json.Anexos = json.Anexos.map(a => formatarUrlAnexo({ ...a, toJSON: () => a }))
      return json
    })
    res.json({ sucesso: true, data: historicoFormatado })
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: erro.message })
  }
}

export const historicoDoAnimal = async (req, res) => {
  try {
    const { petId } = req.params
    const historico = await HistoricoConsulta.findAll({
      where: { petId },
      include: [Pet, Cliente, Anexo],
      order: [['data', 'DESC']]
    })
    // Formatar URLs dos anexos
    const historicoFormatado = historico.map(h => {
      const json = h.toJSON()
      if (json.Anexos) json.Anexos = json.Anexos.map(a => formatarUrlAnexo({ ...a, toJSON: () => a }))
      return json
    })
    res.json({ sucesso: true, data: historicoFormatado })
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

export const gerarPDFHistorico = async (req, res) => {
  try {
    const { id } = req.params
    const historico = await HistoricoConsulta.findByPk(id, {
      include: [Pet, Cliente, Anexo]
    })

    if (!historico) {
      return res.status(404).json({ sucesso: false, erro: 'Histórico não encontrado' })
    }

    const PDFDocument = (await import('pdfkit')).default
    const fs = await import('fs')
    const path = await import('path')
    const { fileURLToPath } = await import('url')
    const doc = new PDFDocument({ margin: 40, bufferPages: true })

    const petNomePdf = (historico.Pet?.nome || 'historico').replace(/[^a-zA-Z0-9-_]/g, '_')
    res.setHeader('Content-Type', 'application/pdf')
    // inline = visualizar no navegador; impressão/download ficam a critério do usuário
    res.setHeader('Content-Disposition', `inline; filename="historico_${petNomePdf}_${historico.id}.pdf"`)
    doc.pipe(res)

    // Header
    doc.fontSize(20).font('Helvetica-Bold').text('VetAssist', { align: 'center' })
    doc.fontSize(12).font('Helvetica').text('Relatório de Histórico de Consulta', { align: 'center' })
    doc.moveTo(40, doc.y + 5).lineTo(550, doc.y + 5).stroke()
    doc.moveDown(0.5)

    // Cliente
    doc.fontSize(11).font('Helvetica-Bold').text('CLIENTE')
    doc.fontSize(10).font('Helvetica').text(historico.Cliente?.nome || '—', { indent: 10 })
    if (historico.Cliente?.telefone) {
      doc.text(`Telefone: ${historico.Cliente.telefone}`, { indent: 10 })
    }
    if (historico.Cliente?.email) {
      doc.text(`Email: ${historico.Cliente.email}`, { indent: 10 })
    }
    doc.moveDown()

    // Animal
    doc.fontSize(11).font('Helvetica-Bold').text('ANIMAL')
    const nomeAnimal = historico.Pet?.nome || '—'
    const especieRaca = historico.Pet ? `${historico.Pet.especie || ''}${historico.Pet.raca ? ` • ${historico.Pet.raca}` : ''}`.trim() : '—'
    doc.fontSize(10).font('Helvetica').text(nomeAnimal, { indent: 10 })
    if (especieRaca) {
      doc.text(especieRaca, { indent: 10 })
    }
    doc.moveDown()

    // Data e Tipo
    doc.fontSize(11).font('Helvetica-Bold').text('CONSULTA')
    const dataFormatada = historico.data
      ? new Date(historico.data).toLocaleDateString('pt-BR', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      : '—'
    doc.fontSize(10).font('Helvetica').text(`Data: ${dataFormatada}`, { indent: 10 })
    if (historico.tipoAtendimento) {
      doc.text(`Tipo: ${historico.tipoAtendimento}`, { indent: 10 })
    }
    doc.moveDown()

    // Detalhes
    if (historico.procedimentos) {
      doc.fontSize(11).font('Helvetica-Bold').text('PROCEDIMENTOS')
      doc.fontSize(10).font('Helvetica').text(historico.procedimentos, { align: 'left', indent: 10 })
      doc.moveDown(0.5)
    }

    if (historico.diagnostico) {
      doc.fontSize(11).font('Helvetica-Bold').text('DIAGNÓSTICO')
      doc.fontSize(10).font('Helvetica').text(historico.diagnostico, { align: 'left', indent: 10 })
      doc.moveDown(0.5)
    }

    if (historico.medicamentos) {
      doc.fontSize(11).font('Helvetica-Bold').text('MEDICAMENTOS')
      doc.fontSize(10).font('Helvetica').text(historico.medicamentos, { align: 'left', indent: 10 })
      doc.moveDown(0.5)
    }

    if (historico.observacoes) {
      doc.fontSize(11).font('Helvetica-Bold').text('OBSERVAÇÕES')
      doc.fontSize(10).font('Helvetica').text(historico.observacoes, { align: 'left', indent: 10 })
      doc.moveDown(0.5)
    }

    if (historico.proximoRetorno) {
      doc.fontSize(11).font('Helvetica-Bold').text('PRÓXIMO RETORNO')
      const dataRetorno = new Date(historico.proximoRetorno).toLocaleDateString('pt-BR')
      doc.fontSize(10).font('Helvetica').text(dataRetorno, { indent: 10 })
      doc.moveDown(0.5)
    }

    // Fotos do histórico
    if (historico.Anexos && historico.Anexos.length > 0) {
      doc.fontSize(11).font('Helvetica-Bold').text('FOTOS DO ATENDIMENTO')
      doc.moveDown(0.3)

      let x = 50
      let y = doc.y
      const photoWidth = 100
      const photoHeight = 100
      const spacing = 15

      // Os arquivos ficam sempre em backend/uploads com nome único,
      // então basta o basename independente do formato salvo no banco
      const uploadsDir = path.default.join(
        path.default.dirname(fileURLToPath(import.meta.url)),
        '../uploads'
      )

      for (const anexo of historico.Anexos) {
        try {
          const caminhoCompleto = path.default.join(
            uploadsDir,
            path.default.basename(anexo.caminhoArquivo)
          )

          if (fs.default.existsSync(caminhoCompleto)) {
            // Adicionar nova linha se necessário
            if (x + photoWidth + spacing > 550) {
              y += photoHeight + spacing
              x = 50
            }

            doc.image(caminhoCompleto, x, y, { width: photoWidth, height: photoHeight })
            x += photoWidth + spacing
          }
        } catch (erroFoto) {
          console.error('[PDF] Erro ao incluir foto:', erroFoto.message)
        }
      }

      doc.y = y + photoHeight + 10
      doc.moveDown(0.5)
    }

    // Valor
    if (historico.valor) {
      doc.fontSize(11).font('Helvetica-Bold').text('VALOR')
      const valorFormatado = parseFloat(historico.valor).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      })
      doc.fontSize(10).font('Helvetica').text(valorFormatado, { indent: 10 })
      doc.moveDown()
    }

    // Rodapé
    doc.moveTo(40, doc.y).lineTo(550, doc.y).stroke()
    doc.fontSize(8).font('Helvetica').text(
      `Relatório gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`,
      { align: 'center', color: '#666' }
    )

    doc.end()
  } catch (erro) {
    console.error('[PDF] Erro ao gerar PDF:', erro)
    res.status(500).json({ sucesso: false, erro: erro.message })
  }
}
