import { useState } from 'react'
import { createPortal } from 'react-dom'
import axios from 'axios'
import './PagamentoModal.css'

export default function PagamentoModal({ faturamento, onClose, onSuccess, isNested = false }) {
  const valorFaltante = parseFloat(faturamento.valor) - parseFloat(faturamento.valorRecebido || 0)
  const valorTotal = parseFloat(faturamento.valor)
  const semValorDefinido = valorTotal <= 0 // retorno ou agendamento sem valor

  // Pré-preencher com o valor faltante (ou vazio se for 0 indefinido)
  const [valorPagamento, setValorPagamento] = useState(
    valorFaltante > 0 ? valorFaltante.toFixed(2) : ''
  )
  const [dataPagamento, setDataPagamento] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  // Aumentar z-index quando renderizado dentro de outro modal
  const overlayStyle = isNested ? { zIndex: 3000 } : {}

  const [gratuito, setGratuito] = useState(null) // null | 'retorno' | 'atendimento'
  const isGratuito = gratuito !== null

  // Quando gratuito, aceita R$0; quando tem valor, valida normalmente
  const valorNumerico = parseFloat(valorPagamento) || 0
  const maxPermitido = semValorDefinido ? Infinity : valorFaltante
  const isValorValido = isGratuito || (valorNumerico > 0 && valorNumerico <= maxPermitido)
  const mensagemErroValor = !isGratuito && !semValorDefinido && valorNumerico > valorFaltante
    ? `Máximo: R$ ${valorFaltante.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    : ''

  // Histórico de pagamentos anteriores
  const historicoPagamentos = Array.isArray(faturamento.historicoPagamentos)
    ? faturamento.historicoPagamentos
    : []

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErro('')

    const valor = isGratuito ? 0 : parseFloat(valorPagamento)

    if (!isGratuito && (!valorPagamento || valor <= 0)) {
      setErro('Insira um valor válido ou selecione uma opção gratuita')
      return
    }

    if (!isGratuito && !semValorDefinido && valor > valorFaltante) {
      setErro(`Valor não pode ser maior que R$ ${valorFaltante.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (valor devido)`)
      return
    }

    try {
      setLoading(true)
      const response = await axios.post(`/api/faturamento/${faturamento.id}/pagamento`, {
        faturamentoId: faturamento.id,
        valorPagamento: valor,
        dataPagamento: dataPagamento,
        gratuito: isGratuito
      })

      if (response.data.sucesso) {
        setValorPagamento('')
        // Chamar callback ANTES de fechar para que o histórico possa se atualizar
        onSuccess(response.data.data)
        // Disparar evento para recarregar Dashboard (MobileHome + MobileCobrancas)
        window.dispatchEvent(new CustomEvent('pagamentoRegistrado'))
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

  return createPortal(
    <div className="modal-overlay" style={overlayStyle} onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Registrar Pagamento</h2>
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

          {/* Histórico de pagamentos anteriores */}
          {historicoPagamentos.length > 0 && (
            <div className="historico-pagamentos">
              <div className="historico-titulo">Pagamentos Anteriores</div>
              <div className="historico-lista">
                {historicoPagamentos.map((pag, idx) => (
                  <div key={idx} className="historico-item">
                    <div className="historico-data">
                      {new Date(pag.data + 'T00:00:00').toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })}
                    </div>
                    <div className="historico-valor">
                      {pag.gratuito ? '(Gratuito)' : `R$ ${parseFloat(pag.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Valor do Pagamento *</label>

                {!isGratuito && (
                  <>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max={semValorDefinido ? undefined : valorFaltante}
                      value={valorPagamento}
                      onChange={(e) => setValorPagamento(e.target.value)}
                      placeholder={semValorDefinido ? 'Informe o valor cobrado' : `R$ ${valorFaltante.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                      disabled={loading}
                      autoFocus
                      style={{ borderColor: mensagemErroValor ? '#ff6b6b' : 'inherit' }}
                    />
                    {mensagemErroValor && (
                      <small className="help-text" style={{ color: '#ff6b6b' }}>{mensagemErroValor}</small>
                    )}
                  </>
                )}

                {/* Opções gratuito — clique para marcar, clique novamente para desmarcar */}
                <div className="gratuito-opcoes">
                  {[
                    { key: 'retorno', label: 'Retorno gratuito (R$ 0,00)' },
                    { key: 'atendimento', label: 'Atendimento gratuito (R$ 0,00)' }
                  ].map(({ key, label }) => (
                    <div
                      key={key}
                      className={`gratuito-check ${gratuito === key ? 'selecionado' : ''}`}
                      onClick={() => {
                        if (gratuito === key) {
                          setGratuito(null)
                          setValorPagamento(valorFaltante > 0 ? valorFaltante.toFixed(2) : '')
                        } else {
                          setGratuito(key)
                          setValorPagamento('')
                        }
                      }}
                    >
                      <span className="gratuito-bolinha">{gratuito === key ? '●' : '○'}</span>
                      {label}
                    </div>
                  ))}
                </div>
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
    </div>,
    document.body
  )
}
