import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import axios from 'axios'
import './DiagnosisModal.css'

export default function DiagnosisModal({ agendamentoId, historicoId, onClose, onSave }) {
  const [formData, setFormData] = useState({
    diagnostico: '',
    observacoes: '',
    procedimentos: '',
    medicamentos: '',
    tipoAtendimento: '',
    proximoRetorno: '',
    valor: 0
  })
  const [agendamentoData, setAgendamentoData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Carregar dados do agendamento ao abrir o modal
  useEffect(() => {
    if (agendamentoId) {
      loadAgendamento()
    }
  }, [agendamentoId])

  const loadAgendamento = async () => {
    try {
      const res = await axios.get(`/api/agendamentos`)
      const agendamento = res.data.data?.find(a => a.id === parseInt(agendamentoId))
      if (agendamento) {
        setAgendamentoData(agendamento)
        // Carregar os dados do agendamento como padrão
        setFormData(prev => ({
          ...prev,
          diagnostico: agendamento.diagnostico || '',
          observacoes: agendamento.observacoes || '',
          procedimentos: agendamento.procedimentos || '',
          medicamentos: agendamento.medicamentos || '',
          tipoAtendimento: agendamento.tipoAtendimento || '',
          proximoRetorno: agendamento.proximoRetorno ? new Date(agendamento.proximoRetorno).toISOString().split('T')[0] : '',
          valor: agendamento.valor || 0
        }))
      }
    } catch (err) {
      console.error('Erro ao carregar agendamento:', err)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target

    if (name === 'valor') {
      // Aceitar valores com vírgula ou ponto
      const normalized = value.replace(',', '.')
      setFormData(prev => ({
        ...prev,
        [name]: normalized
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const handleValorBlur = (e) => {
    // Converter para número, formatando com 2 casas decimais
    const normalized = e.target.value.replace(',', '.')
    const numValue = parseFloat(normalized) || 0
    setFormData(prev => ({
      ...prev,
      valor: parseFloat(numValue.toFixed(2))
    }))
  }

  const formatValor = (valor) => {
    return typeof valor === 'number' ?
      valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) :
      valor
  }

  const handleSave = async () => {
    if (!formData.diagnostico && !formData.observacoes) {
      setError('Preencha pelo menos diagnóstico ou observações')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Se o valor estiver em branco, usar o do agendamento
      const valorFinal = formData.valor && parseFloat(formData.valor) > 0
        ? parseFloat(formData.valor)
        : (agendamentoData?.valor || 0)

      let res

      if (historicoId) {
        // Atualizar histórico existente
        res = await axios.put(`/api/historico/${historicoId}`, {
          diagnostico: formData.diagnostico,
          observacoes: formData.observacoes,
          procedimentos: formData.procedimentos,
          medicamentos: formData.medicamentos,
          tipoAtendimento: formData.tipoAtendimento,
          proximoRetorno: formData.proximoRetorno ? new Date(formData.proximoRetorno).toISOString() : null,
          valor: valorFinal
        })
      } else if (agendamentoId) {
        // Apenas atualizar agendamento com diagnóstico (não criar histórico ainda)
        // O histórico será criado quando o agendamento for marcado como Concluído
        res = await axios.put(`/api/agendamentos/${agendamentoId}`, {
          diagnostico: formData.diagnostico,
          observacoes: formData.observacoes,
          procedimentos: formData.procedimentos,
          medicamentos: formData.medicamentos,
          tipoAtendimento: formData.tipoAtendimento,
          proximoRetorno: formData.proximoRetorno ? new Date(formData.proximoRetorno).toISOString() : null,
          valor: valorFinal
        })
      }

      if (res.data.sucesso) {
        setError('')
        if (onSave) {
          onSave(res.data.data)
        }
        setTimeout(() => onClose(), 500)
      }
    } catch (err) {
      console.error('Erro ao salvar diagnóstico:', err)
      setError('Erro ao salvar diagnóstico. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content diagnosis-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Diagnóstico e Observações</h3>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="diagnosis-form">
          <div className="form-group">
            <label>Tipo de Atendimento</label>
            <input
              type="text"
              name="tipoAtendimento"
              value={formData.tipoAtendimento}
              onChange={handleChange}
              placeholder="Ex: Consulta, Vacinação, Cirurgia..."
            />
          </div>

          <div className="form-group">
            <label>Diagnóstico *</label>
            <textarea
              name="diagnostico"
              value={formData.diagnostico}
              onChange={handleChange}
              placeholder="Descreva o diagnóstico do animal..."
              rows={4}
            />
          </div>

          <div className="form-group">
            <label>Observações e Anotações</label>
            <textarea
              name="observacoes"
              value={formData.observacoes}
              onChange={handleChange}
              placeholder="Anotações adicionais sobre o atendimento..."
              rows={4}
            />
          </div>

          <div className="form-group">
            <label>Medicamentos Prescritos</label>
            <textarea
              name="medicamentos"
              value={formData.medicamentos}
              onChange={handleChange}
              placeholder="Medicamentos recomendados, dosagem, frequência..."
              rows={3}
            />
          </div>

          <div className="form-group">
            <label>Procedimentos Realizados</label>
            <textarea
              name="procedimentos"
              value={formData.procedimentos}
              onChange={handleChange}
              placeholder="Descreva os procedimentos realizados..."
              rows={3}
            />
          </div>

          <div className="form-group">
            <label>Valor (R$)</label>
            <input
              type="text"
              name="valor"
              value={formData.valor ? formatValor(parseFloat(formData.valor.toString().replace(',', '.'))) : ''}
              onChange={handleChange}
              onBlur={handleValorBlur}
              placeholder="0,00"
            />
          </div>

          <div className="form-group">
            <label>Próximo Retorno</label>
            <input
              type="date"
              name="proximoRetorno"
              value={formData.proximoRetorno}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="modal-actions">
          <button
            className="btn-cancel"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            className="btn-save"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? 'Salvando...' : 'Salvar Diagnóstico'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
