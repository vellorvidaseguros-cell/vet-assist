import { useState } from 'react'
import { createPortal } from 'react-dom'
import axios from 'axios'
import MoneyInput from './MoneyInput'
import { useSwipeToClose } from '../hooks/useSwipeToClose'
import './DespesaModal.css'

export default function DespesaModal({
  isOpen,
  onClose,
  onSuccess,
  veterinarioId = 1,
  categoriasDespesa = []
}) {
  const { ref: swipeRef, style: swipeStyle } = useSwipeToClose(onClose)
  const [despesaForm, setDespesaForm] = useState({
    categoriaDespesa: '',
    descricao: '',
    valor: '',
    tipo: 'Gasto',
    recorrente: false,
    frequenciaRecorrencia: 'Mensal'
  })

  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  const handleAddDespesa = async (e) => {
    e.preventDefault()
    setErro('')

    try {
      setLoading(true)
      const response = await axios.post('/api/despesas', {
        ...despesaForm,
        veterinarioId,
        valor: parseFloat(despesaForm.valor)
      })

      if (response.data.sucesso) {
        setDespesaForm({
          categoriaDespesa: '',
          descricao: '',
          valor: '',
          tipo: 'Gasto',
          recorrente: false,
          frequenciaRecorrencia: 'Mensal'
        })
        onSuccess()
        onClose()
      }
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao adicionar despesa')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" ref={swipeRef} style={swipeStyle} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Nova Despesa</h2>
          <button className="modal-close" onClick={onClose} disabled={loading}>×</button>
        </div>

        <div className="modal-body">
          <form onSubmit={handleAddDespesa}>
            <div className="form-row">
              <div className="form-group">
                <label>Categoria *</label>
                <select
                  value={despesaForm.categoriaDespesa}
                  onChange={(e) => setDespesaForm({ ...despesaForm, categoriaDespesa: e.target.value })}
                  required
                  disabled={loading}
                >
                  <option value="">Selecione uma categoria</option>
                  {categoriasDespesa.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Valor *</label>
                <MoneyInput
                  value={despesaForm.valor}
                  onChangeValue={(v) => setDespesaForm({ ...despesaForm, valor: v ?? '' })}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Descrição</label>
                <input
                  type="text"
                  value={despesaForm.descricao}
                  onChange={(e) => setDespesaForm({ ...despesaForm, descricao: e.target.value })}
                  placeholder="Detalhes da despesa"
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label>Tipo</label>
                <select
                  value={despesaForm.tipo}
                  onChange={(e) => setDespesaForm({ ...despesaForm, tipo: e.target.value })}
                  disabled={loading}
                >
                  <option value="Gasto">Gasto</option>
                  <option value="Investimento">Investimento</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group checkbox-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={despesaForm.recorrente}
                    onChange={(e) => setDespesaForm({ ...despesaForm, recorrente: e.target.checked })}
                    style={{ width: 'auto', margin: 0 }}
                    disabled={loading}
                  />
                  Despesa Recorrente
                </label>
              </div>
              {despesaForm.recorrente && (
                <div className="form-group">
                  <label>Frequência</label>
                  <select
                    value={despesaForm.frequenciaRecorrencia}
                    onChange={(e) => setDespesaForm({ ...despesaForm, frequenciaRecorrencia: e.target.value })}
                    disabled={loading}
                  >
                    <option value="Semanal">Semanal</option>
                    <option value="Mensal">Mensal</option>
                    <option value="Bimestral">Bimestral</option>
                    <option value="Trimestral">Trimestral</option>
                    <option value="Semestral">Semestral</option>
                    <option value="Anual">Anual</option>
                  </select>
                </div>
              )}
            </div>

            {erro && <div className="error-message">{erro}</div>}

            <div className="modal-actions">
              <button
                type="button"
                className="btn-cancelar"
                onClick={onClose}
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-registrar"
                disabled={loading}
              >
                {loading ? 'Registrando...' : 'Registrar Despesa'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  )
}
