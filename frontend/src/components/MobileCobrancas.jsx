import { useState, useEffect } from 'react'
import axios from 'axios'
import PagamentoModal from './PagamentoModal'
import './MobileCobrancas.css'

export default function MobileCobrancas() {
  const [faturamentos, setFaturamentos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filtro, setFiltro] = useState('Pendente')
  const [pagamentoModalFat, setPagamentoModalFat] = useState(null)

  useEffect(() => {
    fetchFaturamentos()
  }, [])

  const fetchFaturamentos = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/faturamento')
      if (response.data.sucesso) {
        setFaturamentos(response.data.data || [])
      }
    } catch (err) {
      setError('Erro ao carregar cobranças')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const faturamentosFiltrados = faturamentos.filter(f => {
    if (filtro === 'Todos') return true
    return f.status === filtro
  })

  const totalPendente = faturamentos
    .filter(f => f.status === 'Pendente')
    .reduce((sum, f) => sum + parseFloat(f.valor || 0), 0)

  if (loading) {
    return <div className="mobile-cobrancas-loading">Carregando...</div>
  }

  return (
    <div className="mobile-cobrancas-container">
      {error && (
        <div className="mobile-error">
          {error}
          <button onClick={() => setError('')}>×</button>
        </div>
      )}

      {/* Resumo */}
      <div className="mobile-cobrancas-resumo">
        <div className="resumo-card resumo-a-receber">
          <span className="resumo-label">À Receber</span>
          <span className="resumo-valor">
            R$ {totalPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="resumo-card resumo-faturamento-mes">
          <span className="resumo-label">Faturamento do Mês</span>
          <span className="resumo-valor">
            R$ {faturamentos
              .filter(f => {
                const dataFat = new Date(f.createdAt)
                const hoje = new Date()
                return dataFat.getMonth() === hoje.getMonth() && dataFat.getFullYear() === hoje.getFullYear()
              })
              .reduce((sum, f) => sum + parseFloat(f.valor || 0), 0)
              .toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="resumo-card resumo-faturado-hoje">
          <span className="resumo-label">Faturado Hoje</span>
          <span className="resumo-valor">
            R$ {faturamentos
              .filter(f => {
                const dataFat = new Date(f.createdAt)
                const hoje = new Date()
                return dataFat.getDate() === hoje.getDate() && dataFat.getMonth() === hoje.getMonth() && dataFat.getFullYear() === hoje.getFullYear()
              })
              .reduce((sum, f) => sum + parseFloat(f.valor || 0), 0)
              .toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Filtros */}
      <div className="mobile-cobrancas-filtros">
        {['Todos', 'Pendente', 'Pago', 'Parcialmente Pago'].map(status => (
          <button
            key={status}
            className={`filtro-btn ${filtro === status ? 'ativo' : ''}`}
            onClick={() => setFiltro(status)}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Lista */}
      {faturamentosFiltrados.length === 0 ? (
        <div className="mobile-cobrancas-empty">
          Nenhuma cobrança {filtro === 'Todos' ? '' : `${filtro.toLowerCase()}`}
        </div>
      ) : (
        <div className="mobile-cobrancas-list">
          {faturamentosFiltrados.map(cobranca => (
            <div key={cobranca.id} className="mobile-cobranca-item">
              <div className="cobranca-header">
                <div className="cobranca-cliente">
                  👤 {cobranca.Cliente?.nome || 'Cliente'}
                </div>
                <div className={`cobranca-status ${(cobranca.status || '').toLowerCase().replace(' ', '-')}`}>
                  {cobranca.status}
                </div>
              </div>

              <div className="cobranca-info">
                <div className="cobranca-pet">
                  🐾 {cobranca.HistoricoConsulta?.Pet?.nome || 'Pet'}
                </div>
                <div className="cobranca-valor">
                  R$ {parseFloat(cobranca.valor).toLocaleString('pt-BR', {
                    minimumFractionDigits: 2
                  })}
                </div>
              </div>

              {cobranca.status === 'Pendente' && (
                <button
                  className="cobranca-btn-pagar"
                  onClick={() => setPagamentoModalFat(cobranca)}
                >
                  Registrar Pagamento
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {pagamentoModalFat && (
        <PagamentoModal
          faturamento={pagamentoModalFat}
          onClose={() => setPagamentoModalFat(null)}
          onSuccess={() => {
            setPagamentoModalFat(null)
            fetchFaturamentos()
          }}
        />
      )}
    </div>
  )
}
