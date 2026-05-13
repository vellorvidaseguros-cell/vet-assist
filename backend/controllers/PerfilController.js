import { Veterinario } from '../models/index.js'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Resolver caminho físico do arquivo da logo, independente do formato salvo
const resolverCaminhoLogo = (logomarcaUrl) => {
  if (!logomarcaUrl) return null

  // Normalizar barras
  let caminho = logomarcaUrl.replace(/\\/g, '/')

  // Extrair só o filename (último segmento)
  const filename = caminho.split('/').pop()
  if (!filename) return null

  // Construir caminho absoluto até /backend/uploads/filename
  return path.join(__dirname, '..', 'uploads', filename)
}

export const obterPerfil = async (req, res) => {
  try {
    const { veterinarioId } = req.params
    const veterinario = await Veterinario.findByPk(veterinarioId, {
      attributes: { exclude: ['senha'] }
    })
    if (!veterinario) return res.status(404).json({ sucesso: false, erro: 'Veterinário não encontrado' })

    // Garantir que whiteLabel é sempre um objeto quando retornado
    const data = veterinario.toJSON()
    if (data.whiteLabel && typeof data.whiteLabel === 'string') {
      try {
        data.whiteLabel = JSON.parse(data.whiteLabel)
      } catch (e) {
        console.error('[ERROR] Erro ao parsear whiteLabel:', e)
        data.whiteLabel = null
      }
    }

    res.json({ sucesso: true, data })
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: erro.message })
  }
}

export const atualizarPerfil = async (req, res) => {
  try {
    const { veterinarioId } = req.params
    const veterinario = await Veterinario.findByPk(veterinarioId)

    if (!veterinario) return res.status(404).json({ sucesso: false, erro: 'Veterinário não encontrado' })

    // Não permitir atualização de email se já existe outro usuário com esse email
    if (req.body.email && req.body.email !== veterinario.email) {
      const emailExistente = await Veterinario.findOne({ where: { email: req.body.email } })
      if (emailExistente) {
        return res.status(400).json({ sucesso: false, erro: 'Email já utilizado' })
      }
    }

    // Campos permitidos para atualização
    const camposPermitidos = [
      'nome', 'email', 'telefone', 'cpf', 'crmv',
      'dataNascimento', 'genero', 'endereco', 'cidade', 'estado',
      'nomeClinica', 'cnpj', 'especialidade', 'fotoPerfil', 'logomarcaUrl', 'tabelaPrecos', 'whiteLabel'
    ]

    const atualizacoes = {}
    camposPermitidos.forEach(campo => {
      if (req.body[campo] !== undefined) {
        atualizacoes[campo] = req.body[campo]
      }
    })

    await veterinario.update(atualizacoes)

    // Não retornar hash da senha
    const safeData = veterinario.toJSON()
    delete safeData.senha

    res.json({
      sucesso: true,
      mensagem: 'Perfil atualizado com sucesso!',
      data: safeData
    })
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: erro.message })
  }
}

export const saveWhiteLabel = async (req, res) => {
  try {
    const { veterinarioId } = req.params
    const veterinario = await Veterinario.findByPk(veterinarioId)

    if (!veterinario) {
      return res.status(404).json({ sucesso: false, erro: 'Veterinário não encontrado' })
    }

    // Manter URL anterior se não foi enviado novo arquivo
    let logomarcaUrl = veterinario.logomarcaUrl || ''

    // Se arquivo foi enviado, processar o caminho
    if (req.file) {
      // Salvar caminho relativo para servir via /test-uploads
      logomarcaUrl = `test-uploads/${req.file.filename}`
      console.log('[DEBUG] Arquivo salvo em:', logomarcaUrl)
    } else if (req.body.logomarcaUrl && !req.body.logomarcaUrl.startsWith('data:')) {
      // Se logomarcaUrl foi enviado e não é base64, usar ele
      logomarcaUrl = req.body.logomarcaUrl
    }

    // Construir objeto white label com dados do formulário
    const whiteLabel = {
      nomeClinica: req.body.nomeClinica || veterinario.nomeClinica || '',
      cnpj: req.body.cnpj || '',
      telefone: req.body.telefone || '',
      email: req.body.email || '',
      endereco: req.body.endereco || '',
      cidade: req.body.cidade || '',
      estado: req.body.estado || '',
      logomarcaUrl: logomarcaUrl
    }

    console.log('[DEBUG] Salvando white label:', JSON.stringify(whiteLabel))

    // Atualizar também campos principais do veterinário
    await veterinario.update({
      nomeClinica: whiteLabel.nomeClinica,
      cnpj: whiteLabel.cnpj,
      telefone: whiteLabel.telefone,
      endereco: whiteLabel.endereco,
      cidade: whiteLabel.cidade,
      estado: whiteLabel.estado,
      logomarcaUrl: whiteLabel.logomarcaUrl,
      whiteLabel: whiteLabel // O setter do model serializa automaticamente
    })

    // Recarregar para garantir que temos os dados atualizados
    await veterinario.reload()

    console.log('[DEBUG] White label salvo e recarregado:', JSON.stringify(veterinario.whiteLabel))

    res.json({
      sucesso: true,
      mensagem: 'White label salvo com sucesso!',
      data: typeof veterinario.whiteLabel === 'string' ? JSON.parse(veterinario.whiteLabel) : veterinario.whiteLabel
    })
  } catch (erro) {
    console.error('[ERROR] saveWhiteLabel:', erro)
    res.status(500).json({ sucesso: false, erro: erro.message })
  }
}

// Nova rota: retorna logo do veterinário direto como Base64 (sem CORS, sem timing)
export const obterLogoBase64 = async (req, res) => {
  try {
    const { veterinarioId } = req.params
    const veterinario = await Veterinario.findByPk(veterinarioId)

    if (!veterinario || !veterinario.logomarcaUrl) {
      return res.json({ sucesso: true, data: null })
    }

    const caminhoFisico = resolverCaminhoLogo(veterinario.logomarcaUrl)
    console.log('[DEBUG] Logo - caminho resolvido:', caminhoFisico)

    if (!caminhoFisico || !fs.existsSync(caminhoFisico)) {
      console.error('[ERROR] Logo não encontrada no disco:', caminhoFisico)
      return res.json({ sucesso: true, data: null })
    }

    // Ler arquivo e converter para base64
    const ext = path.extname(caminhoFisico).toLowerCase().replace('.', '')
    const mimeTypes = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp' }
    const mime = mimeTypes[ext] || 'image/png'

    const fileBuffer = fs.readFileSync(caminhoFisico)
    const base64 = `data:${mime};base64,${fileBuffer.toString('base64')}`

    res.json({ sucesso: true, data: base64 })
  } catch (erro) {
    console.error('[ERROR] obterLogoBase64:', erro)
    res.status(500).json({ sucesso: false, erro: erro.message })
  }
}
