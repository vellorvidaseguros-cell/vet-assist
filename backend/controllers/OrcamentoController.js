import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { Veterinario } from '../models/index.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Resolver caminho físico do arquivo da logo, independente do formato salvo
// (mesma lógica de PerfilController.js)
const resolverCaminhoLogo = (logomarcaUrl) => {
  if (!logomarcaUrl) return null
  const caminho = logomarcaUrl.replace(/\\/g, '/')
  const filename = caminho.split('/').pop()
  if (!filename) return null
  return path.join(__dirname, '..', 'uploads', filename)
}

// Gera o PDF de um orçamento (não persistido em banco — os dados vêm do
// formulário do QuoteModal). Usa pdfkit, igual ao PDF de histórico, para que
// o frontend consiga baixar/compartilhar um arquivo de verdade (não apenas
// uma janela de impressão do navegador).
export const gerarPDFOrcamento = async (req, res) => {
  try {
    const { cliente, pet, procedimentos, observacao, dataValidade, total } = req.body

    if (!Array.isArray(procedimentos) || procedimentos.length === 0) {
      return res.status(400).json({ sucesso: false, erro: 'Informe ao menos um procedimento' })
    }

    // "Deslocamento" (visita externa) sempre por último na listagem do PDF
    const itensOrdenados = [...procedimentos].sort((a, b) => {
      const aDeslocamento = /^deslocamento$/i.test((a.descricao || '').trim()) ? 1 : 0
      const bDeslocamento = /^deslocamento$/i.test((b.descricao || '').trim()) ? 1 : 0
      return aDeslocamento - bDeslocamento
    })

    const vet = await Veterinario.findByPk(req.veterinario.id)
    const whiteLabel = (() => {
      if (!vet?.whiteLabel) return null
      if (typeof vet.whiteLabel === 'string') {
        try { return JSON.parse(vet.whiteLabel) } catch { return null }
      }
      return vet.whiteLabel
    })()

    const nomeClinica = vet?.nomeClinica || whiteLabel?.nomeClinica || 'Clínica Veterinária'
    const cnpj = vet?.cnpj || whiteLabel?.cnpj || ''
    const telefoneVet = vet?.telefone || whiteLabel?.telefone || ''
    const emailVet = vet?.email || ''
    const enderecoVet = [vet?.endereco, vet?.cidade, vet?.estado].filter(Boolean).join(', ')
    const crmv = vet?.crmv || ''

    const PDFDocument = (await import('pdfkit')).default
    const doc = new PDFDocument({ margin: 40, bufferPages: true })

    const data = new Date()
    const numeroQuote = `ORC-${data.getTime()}`

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `inline; filename="orcamento_${numeroQuote}.pdf"`)
    doc.pipe(res)

    // Cabeçalho: logo + clínica à esquerda, "ORÇAMENTO" à direita
    const logoPath = resolverCaminhoLogo(vet?.logomarcaUrl)
    let headerTextX = 40
    if (logoPath && fs.existsSync(logoPath)) {
      try {
        doc.image(logoPath, 40, 40, { fit: [70, 50] })
        headerTextX = 120
      } catch {
        headerTextX = 40
      }
    }

    doc.fontSize(16).font('Helvetica-Bold').fillColor('#1a5f2e')
      .text(nomeClinica, headerTextX, 40, { width: 300 })
    doc.fontSize(9).font('Helvetica').fillColor('#666')
    if (crmv) doc.text(`CRMV: ${crmv}`, headerTextX, doc.y)
    if (cnpj) doc.text(`CNPJ: ${cnpj}`, headerTextX, doc.y)

    doc.fontSize(18).font('Helvetica-Bold').fillColor('#000')
      .text('ORÇAMENTO', 350, 40, { width: 205, align: 'right' })
    doc.fontSize(9).font('Helvetica').fillColor('#888')
      .text(`#${numeroQuote}`, 350, doc.y, { width: 205, align: 'right' })
    doc.fillColor('#666')
      .text(`Emissão: ${data.toLocaleDateString('pt-BR')}`, 350, doc.y, { width: 205, align: 'right' })

    doc.y = Math.max(doc.y, 100)
    doc.moveTo(40, doc.y + 5).lineTo(555, doc.y + 5).strokeColor('#1a5f2e').lineWidth(2).stroke()
    doc.moveDown(1.2)
    doc.fillColor('#000')

    // Cliente / Animal (2 colunas)
    const colY = doc.y
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#1a5f2e').text('CLIENTE', 40, colY)
    doc.fontSize(9).font('Helvetica').fillColor('#444')
      .text(cliente?.nome || 'N/A', 40, doc.y + 2)
    if (cliente?.telefone) doc.text(`Tel: ${cliente.telefone}`, 40, doc.y)
    if (cliente?.email) doc.text(cliente.email, 40, doc.y)

    doc.fontSize(10).font('Helvetica-Bold').fillColor('#1a5f2e').text('ANIMAL', 300, colY)
    doc.fontSize(9).font('Helvetica').fillColor('#444')
      .text(pet?.nome || 'N/A', 300, colY + 14)
    if (pet?.especie) doc.text(`Espécie: ${pet.especie}`, 300, doc.y)
    if (pet?.raca) doc.text(`Raça: ${pet.raca}`, 300, doc.y)

    doc.y = Math.max(doc.y, colY + 60)
    doc.fillColor('#000').moveDown(0.8)

    // Tabela de procedimentos
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#1a5f2e').text('PROCEDIMENTOS', 40, doc.y)
    doc.moveDown(0.3)
    const tableTop = doc.y
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#000')
    doc.text('Descrição', 45, tableTop)
    doc.text('Valor', 460, tableTop, { width: 95, align: 'right' })
    doc.moveTo(40, tableTop + 14).lineTo(555, tableTop + 14).strokeColor('#1a5f2e').lineWidth(1).stroke()

    let y = tableTop + 20
    doc.font('Helvetica').fillColor('#333')
    for (const proc of itensOrdenados) {
      const valorNum = parseFloat(String(proc.valor).replace(',', '.')) || 0
      const valorFmt = valorNum.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      doc.fontSize(9).text(proc.descricao || '-', 45, y, { width: 400 })
      doc.text(valorFmt, 460, y, { width: 95, align: 'right' })
      y = doc.y + 6
    }
    doc.moveTo(40, y).lineTo(555, y).strokeColor('#eee').lineWidth(1).stroke()
    doc.y = y + 10

    // Total
    const totalNum = parseFloat(total) || procedimentos.reduce((acc, p) => acc + (parseFloat(String(p.valor).replace(',', '.')) || 0), 0)
    const totalFmt = totalNum.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    doc.fontSize(13).font('Helvetica-Bold').fillColor('#1a5f2e')
      .text(`VALOR TOTAL: ${totalFmt}`, 40, doc.y, { width: 515, align: 'right' })
    doc.moveDown(0.5)

    if (dataValidade) {
      const dataVal = new Date(dataValidade + 'T12:00:00').toLocaleDateString('pt-BR')
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#c0392b')
        .text(`Válido até: ${dataVal}`, 40, doc.y, { width: 515, align: 'right' })
      doc.moveDown(0.5)
    }

    doc.fontSize(8).font('Helvetica').fillColor('#8a6d0b')
      .text('Este é um orçamento estimado. Os valores podem variar de acordo com os materiais e serviços que se mostrarem necessários durante o tratamento.', 40, doc.y + 8, { width: 515 })

    if (observacao) {
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#1a5f2e').text('OBSERVAÇÕES', 40, doc.y + 8)
      doc.fontSize(9).font('Helvetica').fillColor('#555').text(observacao, 40, doc.y + 2, { width: 515 })
    }

    // Rodapé travado no fim de cada página
    const rodapeTexto = [
      cnpj && `CNPJ: ${cnpj}`,
      telefoneVet && `Tel: ${telefoneVet}`,
      emailVet,
      enderecoVet
    ].filter(Boolean).join('   •   ')
    const geradoEm = `Gerado em ${data.toLocaleDateString('pt-BR')} às ${data.toLocaleTimeString('pt-BR')}`

    // Posições Y explícitas (em vez de encadear via doc.y) para garantir folga
    // segura acima da margem inferior — texto perto demais da borda faz o
    // pdfkit inserir uma página extra automaticamente para não cortar o texto.
    const { start, count } = doc.bufferedPageRange()
    for (let i = start; i < start + count; i++) {
      doc.switchToPage(i)
      const rodapeY = doc.page.height - doc.page.margins.bottom - 42
      doc.moveTo(40, rodapeY).lineTo(555, rodapeY).strokeColor('#1a5f2e').lineWidth(1).stroke()
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#1a5f2e')
        .text(nomeClinica, 40, rodapeY + 6, { align: 'center', width: 515, lineBreak: false })
      doc.fontSize(8).font('Helvetica').fillColor('#555')
        .text(rodapeTexto, 40, rodapeY + 18, { align: 'center', width: 515, lineBreak: false })
      doc.fontSize(7).fillColor('#aaa')
        .text(geradoEm, 40, rodapeY + 29, { align: 'center', width: 515, lineBreak: false })
    }

    doc.end()
  } catch (erro) {
    console.error('[PDF] Erro ao gerar PDF de orçamento:', erro)
    res.status(500).json({ sucesso: false, erro: erro.message })
  }
}
