import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import axios from 'axios'
import { formatarData } from '../utils/dateFormatter'
import PagamentoModal from './PagamentoModal'
import ConfirmModal from './ConfirmModal'
import './HistoricoPagamentosModal.css'

export default function HistoricoPagamentosModal({ faturamento, onClose, onPaymentSuccess }) {
  const [showPagamentoModal, setShowPagamentoModal] = useState(false)
  const [faturamentoAtualizado, setFaturamentoAtualizado] = useState(faturamento)
  const [deletando, setDeletando] = useState(false)
  const [confirm, setConfirm] = useState({ open: false })
  const [refreshKey, setRefreshKey] = useState(0)

  // Recarregar dados do servidor quando o modal é aberto novamente
  useEffect(() => {
    const recarregarDados = async () => {
      try {
        const response = await axios.get(`/api/faturamento`)
        if (response.data.sucesso) {
          const faturamentoAtual = response.data.data.find(f => f.id === faturamento.id)
          if (faturamentoAtual) {
            setFaturamentoAtualizado({ ...faturamentoAtual })
          } else {
            // Se não encontrar, usar o prop
            setFaturamentoAtualizado(faturamento)
          }
        }
      } catch (err) {
        console.error('Erro ao recarregar faturamento:', err)
        setFaturamentoAtualizado(faturamento)
      }
    }

    recarregarDados()
  }, [faturamento.id])

  // Garantir que historicoPagamentos é um array
  const pagamentos = Array.isArray(faturamentoAtualizado.historicoPagamentos)
    ? faturamentoAtualizado.historicoPagamentos
    : []

  console.log('Modal aberto - Faturamento:', faturamentoAtualizado)
  console.log('Pagamentos:', pagamentos)
  console.log('valorRecebido:', faturamentoAtualizado.valorRecebido)

  // Usar o valorRecebido do banco de dados, não calcular manualmente
  const totalPago = parseFloat(faturamentoAtualizado.valorRecebido || 0)

  const handlePagamentoSuccess = async (faturamentoAtualizado) => {
    console.log('[DEBUG] handlePagamentoSuccess chamado com:', faturamentoAtualizado)

    // Sempre recarregar do servidor para garantir sincronização
    try {
      const response = await axios.get(`/api/faturamento`)
      if (response.data.sucesso) {
        const faturamentoRecarregado = response.data.data.find(f => f.id === faturamento.id)
        if (faturamentoRecarregado) {
          console.log('[DEBUG] Faturamento recarregado:', faturamentoRecarregado)
          console.log('[DEBUG] historicoPagamentos:', faturamentoRecarregado.historicoPagamentos)
          console.log('[DEBUG] valorRecebido:', faturamentoRecarregado.valorRecebido)

          // Forçar re-renderização com um novo objeto
          setFaturamentoAtualizado({ ...faturamentoRecarregado })

          // Incrementar key para forçar re-render
          setRefreshKey(prev => prev + 1)
        }
      }
    } catch (err) {
      console.error('Erro ao atualizar faturamento:', err)
    }

    setShowPagamentoModal(false)

    // Notificar o componente pai para atualizar a lista
    if (onPaymentSuccess) {
      onPaymentSuccess()
    }
  }

  const handleDeletarPagamento = (index) => {
    setConfirm({
      open: true,
      title: 'Deletar Pagamento',
      message: 'Tem certeza que deseja deletar este pagamento?',
      confirmText: 'Deletar',
      cancelText: 'Cancelar',
      confirmColor: 'danger',
      loading: deletando,
      onConfirm: async () => {
        try {
          setDeletando(true)
          const response = await axios.delete(`/api/faturamento/${faturamento.id}/pagamento/${index}`)
          if (response.data.sucesso) {
            // Atualizar estado com os dados retornados, forçando novo objeto
            setFaturamentoAtualizado({ ...response.data.data })
            setRefreshKey(prev => prev + 1)

            // Recarregar também do servidor para dupla sincronização
            const refreshResponse = await axios.get(`/api/faturamento`)
            if (refreshResponse.data.sucesso) {
              const faturamentoRecarregado = refreshResponse.data.data.find(f => f.id === faturamento.id)
              if (faturamentoRecarregado) {
                setFaturamentoAtualizado({ ...faturamentoRecarregado })
                setRefreshKey(prev => prev + 1)
              }
            }

            // Notificar pai para atualizar a lista também
            if (onPaymentSuccess) {
              onPaymentSuccess()
            }
            setConfirm({ open: false })
          }
        } catch (err) {
          console.error('Erro ao deletar pagamento:', err)
          alert('Erro ao deletar pagamento')
          setConfirm({ open: false })
        } finally {
          setDeletando(false)
        }
      },
      onCancel: () => setConfirm({ open: false })
    })
  }

  return (
    <>
      {showPagamentoModal && (
        <PagamentoModal
          faturamento={faturamentoAtualizado}
          onClose={() => setShowPagamentoModal(false)}
          onSuccess={handlePagamentoSuccess}
          isNested={true}
        />
      )}

      {createPortal(
        <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Histórico de Pagamentos</h2>
            <button className="modal-close" onClick={onClose}>×</button>
          </div>

          <div className="modal-body">
          <div className="faturamento-info-box">
            <p><strong>{faturamentoAtualizado.descricao}</strong></p>
            <p className="cliente">{faturamentoAtualizado.Cliente?.nome}</p>
            <p className="data">{formatarData(faturamentoAtualizado.dataEmissao)}</p>
          </div>

          <div className="resumo-box">
            <div className="resumo-item">
              <label>Valor Total:</label>
              <span className="valor-total">
                R$ {parseFloat(faturamentoAtualizado.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="resumo-item">
              <label>Total Pago:</label>
              <span className="valor-pago">
                R$ {totalPago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="resumo-item">
              <label>Falta Pagar:</label>
              <span className="valor-faltante">
                R$ {(parseFloat(faturamentoAtualizado.valor) - totalPago).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {pagamentos.length === 0 ? (
            <div className="empty-state">
              <p>Nenhum pagamento registrado</p>
            </div>
          ) : (
            <div className="pagamentos-list">
              <h3>Pagamentos Registrados</h3>
              <div className="list-header">
                <div className="col-data">Data</div>
                <div className="col-valor">Valor</div>
              </div>
              {pagamentos.map((pagamento, index) => (
                <div key={index} className="pagamento-item">
                  <div className="col-data">
                    {typeof pagamento.data === 'string' ?
                      // Converter YYYY-MM-DD para DD/MM/YYYY
                      pagamento.data.split('-').reverse().join('/') :
                      formatarData(pagamento.data)
                    }
                  </div>
                  <div className="col-valor">
                    R$ {parseFloat(pagamento.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="col-acoes">
                    <button
                      className="btn-deletar"
                      onClick={() => handleDeletarPagamento(index)}
                      disabled={deletando}
                      title="Deletar pagamento"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button
            className="btn-registrar-novo"
            onClick={() => setShowPagamentoModal(true)}
          >
            + Registrar Novo Pagamento
          </button>
          <button className="btn-fechar" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </div>,
        document.body
      )}

      <ConfirmModal {...confirm} />
    </>
  )
}
