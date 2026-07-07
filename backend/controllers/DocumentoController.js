import { DocumentoEmitido } from '../models/index.js'

// Salvar um documento emitido (orçamento/cobrança) para consulta futura
export const salvarDocumento = async (req, res) => {
  try {
    const { tipo, numero, clienteNome, petNome, total, dados } = req.body

    const documento = await DocumentoEmitido.create({
      veterinarioId: req.veterinario.id,
      tipo: tipo || 'orcamento',
      numero: numero || null,
      clienteNome: clienteNome || null,
      petNome: petNome || null,
      total: parseFloat(total) || 0,
      dados: dados || null,
    })

    res.status(201).json({ sucesso: true, mensagem: 'Documento salvo!', data: documento })
  } catch (erro) {
    console.error('[ERROR] salvarDocumento:', erro)
    res.status(500).json({ sucesso: false, erro: erro.message })
  }
}

// Listar documentos emitidos (mais recentes primeiro), com filtro opcional por tipo
export const listarDocumentos = async (req, res) => {
  try {
    const where = { veterinarioId: req.veterinario.id }
    if (req.query.tipo) where.tipo = req.query.tipo

    const documentos = await DocumentoEmitido.findAll({
      where,
      order: [['createdAt', 'DESC']]
    })

    res.json({ sucesso: true, data: documentos })
  } catch (erro) {
    console.error('[ERROR] listarDocumentos:', erro)
    res.status(500).json({ sucesso: false, erro: erro.message })
  }
}

// Buscar um documento (para re-gerar o PDF a partir dos dados salvos)
export const buscarDocumento = async (req, res) => {
  try {
    const documento = await DocumentoEmitido.findOne({
      where: { id: req.params.id, veterinarioId: req.veterinario.id }
    })
    if (!documento) return res.status(404).json({ sucesso: false, erro: 'Documento não encontrado' })

    res.json({ sucesso: true, data: documento })
  } catch (erro) {
    console.error('[ERROR] buscarDocumento:', erro)
    res.status(500).json({ sucesso: false, erro: erro.message })
  }
}

// Excluir um documento (soft-delete)
export const deletarDocumento = async (req, res) => {
  try {
    const documento = await DocumentoEmitido.findOne({
      where: { id: req.params.id, veterinarioId: req.veterinario.id }
    })
    if (!documento) return res.status(404).json({ sucesso: false, erro: 'Documento não encontrado' })

    await documento.destroy()
    res.json({ sucesso: true, mensagem: 'Documento removido!' })
  } catch (erro) {
    console.error('[ERROR] deletarDocumento:', erro)
    res.status(500).json({ sucesso: false, erro: erro.message })
  }
}
