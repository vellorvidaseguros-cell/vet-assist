import { HistoricoConsulta, Pet, Cliente, Agendamento, Faturamento, Anexo, Veterinario, Compartilhamento } from '../models/index.js'

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
      where: { veterinarioId: req.veterinario.id },
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

    // Acesso permitido se o animal pertence ao veterinário ou foi compartilhado (aceito) com ele
    const dono = await Pet.findOne({ where: { id: petId, veterinarioId: req.veterinario.id } })
    const compartilhado = dono ? null : await Compartilhamento.findOne({
      where: { animalId: petId, veterinarioConvidadoId: req.veterinario.id, status: 'aceito' }
    })

    if (!dono && !compartilhado) {
      return res.status(404).json({ sucesso: false, erro: 'Animal não encontrado' })
    }

    const podeEditar = !!dono || !!compartilhado?.permissoes?.includes('editar')

    const historico = await HistoricoConsulta.findAll({
      where: { petId },
      // Dados do proprietário (Cliente) só vão para quem é dono do animal —
      // um vet convidado por compartilhamento vê apenas o diário de atendimento.
      include: dono ? [Pet, Cliente, Anexo] : [Pet, Anexo],
      order: [['data', 'DESC']]
    })
    // Formatar URLs dos anexos
    const historicoFormatado = historico.map(h => {
      const json = h.toJSON()
      if (json.Anexos) json.Anexos = json.Anexos.map(a => formatarUrlAnexo({ ...a, toJSON: () => a }))
      return json
    })
    res.json({ sucesso: true, data: historicoFormatado, podeEditar })
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: erro.message })
  }
}

export const criarHistorico = async (req, res) => {
  try {
    const { agendamentoId, petId, data, tipoAtendimento, diagnostico, procedimentos, medicamentos, observacoes, proximoRetorno, veterinario, valor, statusPagamento } = req.body

    if (!petId) {
      return res.status(400).json({ sucesso: false, erro: 'petId é obrigatório' })
    }

    // Autorização: o pet precisa ser do veterinário logado, OU compartilhado
    // (aceito) com permissão de 'editar'. clienteId nunca vem do body — é
    // sempre derivado do Pet, para não ser falsificável e porque um vet
    // convidado (compartilhamento) não tem acesso aos dados do proprietário.
    const pet = await Pet.findByPk(petId)
    if (!pet) {
      return res.status(404).json({ sucesso: false, erro: 'Animal não encontrado' })
    }
    const ehDono = pet.veterinarioId === req.veterinario.id
    if (!ehDono) {
      const compartilhado = await Compartilhamento.findOne({
        where: { animalId: petId, veterinarioConvidadoId: req.veterinario.id, status: 'aceito' }
      })
      if (!compartilhado?.permissoes?.includes('editar')) {
        return res.status(403).json({ sucesso: false, erro: 'Você não tem permissão para registrar atendimentos deste animal' })
      }
    }

    let historicoData = {
      petId,
      clienteId: pet.clienteId,
      veterinarioId: req.veterinario.id,
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

      // Usar dados do agendamento se não foram fornecidos (petId/clienteId já vêm do Pet acima)
      historicoData.data = historicoData.data || agendamento.data
      historicoData.tipoAtendimento = historicoData.tipoAtendimento || agendamento.tipoAtendimento
      historicoData.observacoes = historicoData.observacoes || agendamento.observacoes || ''
    }

    // Validar campos obrigatórios
    if (!historicoData.data) {
      return res.status(400).json({ sucesso: false, erro: 'Informe a data do atendimento.' })
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
          veterinarioId: req.veterinario.id,
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
    const historico = await HistoricoConsulta.findOne({
      where: { id: req.params.id, veterinarioId: req.veterinario.id }
    })
    if (!historico) return res.status(404).json({ sucesso: false, erro: 'Histórico não encontrado' })

    const proximoRetornoAnterior = historico.proximoRetorno
    // Nunca permitir troca de dono via payload
    const dados = { ...req.body }
    delete dados.veterinarioId
    await historico.update(dados)

    // Se proximoRetorno foi adicionado ou alterado, criar agendamento automaticamente
    if (req.body.proximoRetorno && (!proximoRetornoAnterior || new Date(proximoRetornoAnterior).getTime() !== new Date(req.body.proximoRetorno).getTime())) {
      try {
        const dataRetorno = new Date(req.body.proximoRetorno)
        const horaRetorno = dataRetorno.toTimeString().split(' ')[0].substring(0, 5) // HH:MM

        await Agendamento.create({
          petId: historico.petId,
          clienteId: historico.clienteId,
          veterinarioId: req.veterinario.id,
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
    const historico = await HistoricoConsulta.findOne({
      where: { id: req.params.id, veterinarioId: req.veterinario.id }
    })
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
    // Apaga SOMENTE os dados do veterinário logado
    await Faturamento.destroy({ where: { veterinarioId: req.veterinario.id } })
    const count = await HistoricoConsulta.destroy({ where: { veterinarioId: req.veterinario.id } })
    res.json({ sucesso: true, mensagem: `${count} históricos e seus faturamentos apagados com sucesso!`, count })
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: erro.message })
  }
}

// PDF de COBRANÇA — mesmo padrão visual do histórico timbrado (logo + seções verdes),
// porém SEM as fotos do atendimento. Usado no envio de cobrança ao cliente.
export const gerarPDFCobranca = async (req, res) => {
  try {
    const { id } = req.params
    const historico = await HistoricoConsulta.findOne({
      where: { id, veterinarioId: req.veterinario.id },
      include: [Pet, Cliente]
    })

    if (!historico) {
      return res.status(404).json({ sucesso: false, erro: 'Histórico não encontrado' })
    }

    // Valor da cobrança: prioriza o faturamento vinculado; senão, o valor do histórico
    const faturamento = await Faturamento.findOne({
      where: { historicoConsultaId: id, veterinarioId: req.veterinario.id }
    })
    const valor = faturamento?.valor ?? historico.valor

    const veterinarioDono = await Veterinario.findByPk(req.veterinario.id)
    let wl = veterinarioDono?.whiteLabel || null
    if (wl && typeof wl === 'string') {
      try { wl = JSON.parse(wl) } catch { wl = null }
    }
    const nomeClinica = veterinarioDono?.nomeClinica || wl?.nomeClinica || 'VetAssist'
    const cnpj = veterinarioDono?.cnpj || wl?.cnpj || ''
    const telefone = veterinarioDono?.telefone || wl?.telefone || ''
    const email = veterinarioDono?.email || wl?.email || ''
    const endereco = veterinarioDono?.endereco || wl?.endereco || ''
    const cidade = veterinarioDono?.cidade || wl?.cidade || ''
    const estado = veterinarioDono?.estado || wl?.estado || ''

    const PDFDocument = (await import('pdfkit')).default
    const fs = await import('fs')
    const path = await import('path')
    const { fileURLToPath } = await import('url')

    const VERDE = '#0d6b3a'
    const doc = new PDFDocument({ margin: 40, bufferPages: true })

    const petNomePdf = (historico.Pet?.nome || 'cobranca').replace(/[^a-zA-Z0-9-_]/g, '_')
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `inline; filename="cobranca_${petNomePdf}_${historico.id}.pdf"`)
    doc.pipe(res)

    // ===== Cabeçalho timbrado (logo + dados) =====
    const uploadsDir = path.default.join(
      path.default.dirname(fileURLToPath(import.meta.url)),
      '../uploads'
    )
    let logoDesenhada = false
    if (veterinarioDono?.logomarcaUrl) {
      try {
        const caminhoLogo = path.default.join(uploadsDir, path.default.basename(veterinarioDono.logomarcaUrl))
        if (fs.default.existsSync(caminhoLogo)) {
          doc.image(caminhoLogo, 40, 40, { fit: [70, 55] })
          logoDesenhada = true
        }
      } catch (e) {
        console.error('[PDF Cobrança] Erro ao incluir logo:', e.message)
      }
    }

    const textoX = logoDesenhada ? 125 : 40
    const larguraTexto = 555 - textoX
    doc.fontSize(16).font('Helvetica-Bold').fillColor(VERDE).text(nomeClinica, textoX, 42, { width: larguraTexto })
    doc.fontSize(8).font('Helvetica').fillColor('#888')
      .text('COBRANÇA - ATENDIMENTO VETERINÁRIO', textoX, doc.y + 2, { characterSpacing: 1, width: larguraTexto })

    const nomeAnimal = historico.Pet?.nome || '—'
    const especieRaca = historico.Pet
      ? `${historico.Pet.especie || ''}${historico.Pet.raca ? ' • ' + historico.Pet.raca : ''}`.trim()
      : ''
    const dataConsulta = historico.data
      ? new Date(historico.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
      : ''

    doc.fontSize(9).fillColor('#444')
    doc.text(`Proprietário: ${historico.Cliente?.nome || '—'}`, textoX, doc.y + 6, { width: larguraTexto })
    doc.text(`Animal: ${nomeAnimal}${especieRaca ? ` (${especieRaca})` : ''}`, textoX, doc.y + 2, { width: larguraTexto })
    doc.text(
      `${dataConsulta ? `Data: ${dataConsulta}   ` : ''}Tipo: ${historico.tipoAtendimento || 'Atendimento'}`,
      textoX, doc.y + 2, { width: larguraTexto }
    )

    const headerBottom = Math.max(doc.y + 10, 108)
    doc.moveTo(40, headerBottom).lineTo(555, headerBottom).lineWidth(2).strokeColor(VERDE).stroke()
    doc.y = headerBottom + 14
    doc.x = 40

    // ===== Seções (barra verde + conteúdo) =====
    const secao = (titulo, conteudo) => {
      if (!conteudo) return
      // Evita quebrar a barra de título entre páginas
      if (doc.y > 660) doc.addPage()
      const y = doc.y
      doc.rect(40, y, 515, 18).fill(VERDE)
      doc.fontSize(10).font('Helvetica-Bold').fillColor('white').text(titulo.toUpperCase(), 48, y + 5)
      doc.fillColor('#333').font('Helvetica').fontSize(10)
      doc.text(String(conteudo), 48, y + 26, { width: 500 })
      doc.moveDown(0.8)
      doc.x = 40
    }

    secao('Diagnóstico', historico.diagnostico)
    secao('Procedimentos Realizados', historico.procedimentos)
    secao('Medicamentos Prescritos', historico.medicamentos)
    secao('Observações', historico.observacoes)

    // ===== Valor em destaque =====
    if (doc.y > 640) doc.addPage()
    const valorFormatado = parseFloat(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    doc.moveDown(0.5)
    const yv = doc.y
    doc.moveTo(40, yv).lineTo(555, yv).lineWidth(2).strokeColor(VERDE).stroke()
    doc.fontSize(13).font('Helvetica-Bold').fillColor(VERDE)
      .text(`VALOR: ${valorFormatado}`, 40, yv + 10, { align: 'right', width: 515 })
    doc.x = 40

    // ===== Dados para pagamento (caixa destacada) =====
    if (veterinarioDono?.dadosCobranca) {
      doc.font('Helvetica').fontSize(10)
      const alturaTexto = doc.heightOfString(veterinarioDono.dadosCobranca, { width: 490 })
      const alturaCaixa = alturaTexto + 34
      if (doc.y + alturaCaixa > 720) doc.addPage()
      const yb = doc.y + 10
      doc.roundedRect(40, yb, 515, alturaCaixa, 6).fillAndStroke('#f5f9f6', '#d3e6d9')
      doc.fontSize(9).font('Helvetica-Bold').fillColor(VERDE).text('DADOS PARA PAGAMENTO', 52, yb + 10)
      doc.fontSize(10).font('Helvetica').fillColor('#333')
        .text(veterinarioDono.dadosCobranca, 52, yb + 24, { width: 490 })
      doc.x = 40
    }

    // ===== Rodapé timbrado em todas as páginas =====
    const infoPartes = [
      cnpj && `CNPJ: ${cnpj}`,
      telefone && `Tel: ${telefone}`,
      email
    ].filter(Boolean).join('   •   ')
    const enderecoLinha = [endereco, cidade && estado ? `${cidade} - ${estado}` : (cidade || estado)]
      .filter(Boolean).join(', ')
    const geradoEm = `Documento gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`

    const { start, count } = doc.bufferedPageRange()
    for (let i = start; i < start + count; i++) {
      doc.switchToPage(i)
      const rodapeY = doc.page.height - doc.page.margins.bottom - 34
      doc.moveTo(40, rodapeY).lineTo(555, rodapeY).lineWidth(2).strokeColor(VERDE).stroke()
      doc.fontSize(8).font('Helvetica').fillColor('#666')
      let yTexto = rodapeY + 6
      if (infoPartes) {
        doc.text(infoPartes, 40, yTexto, { align: 'center', width: 515 })
        yTexto = doc.y
      }
      if (enderecoLinha) {
        doc.text(enderecoLinha, 40, yTexto, { align: 'center', width: 515 })
        yTexto = doc.y
      }
      doc.fontSize(7).text(geradoEm, 40, yTexto + 1, { align: 'center', width: 515 })
      doc.fillColor('#000')
    }

    doc.end()
  } catch (erro) {
    console.error('[PDF Cobrança] Erro ao gerar PDF:', erro)
    res.status(500).json({ sucesso: false, erro: erro.message })
  }
}

export const gerarPDFHistorico = async (req, res) => {
  try {
    const { id } = req.params
    const historico = await HistoricoConsulta.findOne({
      where: { id, veterinarioId: req.veterinario.id },
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

    // Dados de cobrança (Pix/bancários) NÃO aparecem no PDF de histórico —
    // eles são exibidos apenas no PDF de cobrança (gerarPDFCobranca), conforme regra do produto.

    // Rodapé travado no fim de CADA página (independente de onde o conteúdo terminou),
    // desenhado por último com bufferPages para poder voltar a páginas já renderizadas
    const geradoEm = `Relatório gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`
    const { start, count } = doc.bufferedPageRange()
    for (let i = start; i < start + count; i++) {
      doc.switchToPage(i)
      const rodapeY = doc.page.height - doc.page.margins.bottom - 20
      doc.moveTo(40, rodapeY).lineTo(550, rodapeY).stroke()
      doc.fontSize(8).font('Helvetica').fillColor('#666')
        .text(geradoEm, 40, rodapeY + 5, { align: 'center', width: 510 })
      doc.fillColor('#000')
    }

    doc.end()
  } catch (erro) {
    console.error('[PDF] Erro ao gerar PDF:', erro)
    res.status(500).json({ sucesso: false, erro: erro.message })
  }
}
