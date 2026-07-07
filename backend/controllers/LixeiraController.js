import { Op } from 'sequelize'
import { Cliente, Pet, Agendamento, HistoricoConsulta, Despesa, Insumo } from '../models/index.js'

// Lixeira: lista e restaura registros soft-deletados (paranoid) do veterinário logado.
// Cada modelo usa `paranoid: true`, então .destroy() já é soft-delete (seta deletedAt)
// e as buscas normais (findAll/findOne) já excluem esses registros automaticamente.

const TIPOS = {
  cliente: { model: Cliente, label: 'Cliente', nomeCampo: 'nome' },
  pet: { model: Pet, label: 'Animal', nomeCampo: 'nome' },
  agendamento: { model: Agendamento, label: 'Agendamento', nomeCampo: 'tipoAtendimento' },
  historico: { model: HistoricoConsulta, label: 'Histórico de Consulta', nomeCampo: 'tipoAtendimento' },
  despesa: { model: Despesa, label: 'Despesa', nomeCampo: 'descricao' },
  insumo: { model: Insumo, label: 'Insumo', nomeCampo: 'nome' },
}

export const listarLixeira = async (req, res) => {
  try {
    const veterinarioId = req.veterinario.id
    const itens = []

    for (const [tipo, { model, label, nomeCampo }] of Object.entries(TIPOS)) {
      const registros = await model.findAll({
        where: { veterinarioId, deletedAt: { [Op.ne]: null } },
        paranoid: false,
        order: [['deletedAt', 'DESC']],
      })

      for (const r of registros) {
        itens.push({
          tipo,
          tipoLabel: label,
          id: r.id,
          nome: r[nomeCampo] || `#${r.id}`,
          deletedAt: r.deletedAt,
        })
      }
    }

    itens.sort((a, b) => new Date(b.deletedAt) - new Date(a.deletedAt))

    res.json({ sucesso: true, data: itens })
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: erro.message })
  }
}

export const restaurarItem = async (req, res) => {
  try {
    const { tipo, id } = req.params
    const config = TIPOS[tipo]
    if (!config) {
      return res.status(400).json({ sucesso: false, erro: `Tipo inválido: ${tipo}` })
    }

    const registro = await config.model.findOne({
      where: { id, veterinarioId: req.veterinario.id, deletedAt: { [Op.ne]: null } },
      paranoid: false,
    })
    if (!registro) {
      return res.status(404).json({ sucesso: false, erro: 'Item não encontrado na lixeira' })
    }

    await registro.restore()

    res.json({ sucesso: true, mensagem: `${config.label} restaurado(a) com sucesso!` })
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: erro.message })
  }
}
