import { useState } from 'react'
import axios from 'axios'
import './PagamentoModal.css'

export default function PagamentoModal({ faturamento, onClose, onSuccess, isNested = false }) {
  const [valorPagamento, setValorPagamento] = useState('')
  const [dataPagamento, setDataPagamento] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  const valorFaltante = parseFloat(faturamento.valor) - parseFloat(faturamento.valorRecebido || 0)
  const valorTotal = parseFloat(faturamento.valor)

  // Aumentar z-index quando renderizado dentro de outro modal
  const overlayStyle = isNested ? { zIndex: 3000 } : {}

  // Validar valor em tempo real
  const valorNumerico = parseFloat(valorPagamento) || 0
  const isValorValido = valorNumerico > 0 && valorNumerico <= valorFaltante
  const mensagemErroValor = valorNumerico > valorFaltante
    ? `Máximo: R$ ${valorFaltante.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    : ''

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErro('')

    const valor = parseFloat(valorPagamento)

    if (!valorPagamento || valor <= 0) {
      setErro('⚠️ Insira um valor válido')
      return
    }

    if (valor > valorFaltante) {
      setErro(`⚠️ Valor não pode ser maior que R$ ${valorFaltante.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (valor devido)`)
      return
    }

    try {
      setLoading(true)
      const response = await axios.post(`/api/faturamento/${faturamento.id}/pagamento`, {
        faturamentoId: faturamento.id,
        valorPagamento: parseFloat(valorPagamento),
        dataPagamento: dataPagamento
      })

      if (response.data.sucesso) {
        setValorPagamento('')
        // Chamar callback ANTES de fechar para que o histórico possa se atualizar
        onSuccess(response.data.data)
        // Pequeno delay para garantir que setState foi processado
        setTimeout(() => {
          onClose()
        }, 100)
      }
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao registrar pagamento')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" style={overlayStyle} onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Registrar Pagamento</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="info-box">
            <div className="info-item">
              <label>Valor Total:</label>
              <span className="valor-total">
                R$ {valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="info-item">
              <label>Já Recebido:</label>
              <span className="valor-recebido">
                R$ {parseFloat(faturamento.valorRecebido || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="info-item">
              <label>Falta Receber:</label>
              <span className="valor-faltante">
                R$ {valorFaltante.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Valor do Pagamento *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={valorFaltante}
                  value={valorPagamento}
                  onChange={(e) => setValorPagamento(e.target.value)}
                  placeholder={`Até R$ ${valorFaltante.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                  disabled={loading}
                  style={{
                    borderColor: valorNumerico > valorFaltante && valorNumerico > 0 ? '#ff6b6b' : 'inherit'
                  }}
                />
                <small className="help-text">
                  {mensagemErroValor || `Máximo: R$ ${valorFaltante.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                </small>
              </div>

              <div className="form-group">
                <label>Data do Pagamento *</label>
                <input
                  type="date"
                  value={dataPagamento}
                  onChange={(e) => setDataPagamento(e.target.value)}
                  disabled={loading}
                />
              </div>
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
                disabled={loading || !isValorValido}
                title={!isValorValido && valorPagamento ? `Valor deve ser entre R$ 0,01 e R$ ${valorFaltante.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : ''}
              >
                {loading ? 'Registrando...' : 'Registrar Pagamento'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
