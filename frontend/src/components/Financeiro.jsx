import { useState, useEffect } from 'react'
import axios from 'axios'
import { formatarData } from '../utils/dateFormatter'
import PagamentoModal from './PagamentoModal'
import HistoricoPagamentosModal from './HistoricoPagamentosModal'
import DespesaModal from './DespesaModal'
import GastosCategoriaPieChartCard from './GastosCategoriaPieChartCard'
import './Financeiro.css'

export default function Financeiro() {
  const [resumo, setResumo] = useState(null)
  const [despesas, setDespesas] = useState([])
  const [faturamentos, setFaturamentos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showNovaDepesa, setShowNovaDepesa] = useState(false)
  const [filtroStatus, setFiltroStatus] = useState('Todos')
  const [showPagamentoModal, setShowPagamentoModal] = useState(false)
  const [showHistoricoModal, setShowHistoricoModal] = useState(false)
  const [faturamentoSelecionado, setFaturamentoSelecionado] = useState(null)

  const veterinarioId = 1

  const categoriasDespesa = [
    'Aluguel',
    'Equipamentos',
    'Medicamentos',
    'Produtos',
    'Energia',
    'Água',
    'Internet',
    'Telefone',
    'Transporte',
    'Manutenção',
    'Seguro',
    'Salários',
    'Impostos',
    'Outro'
  ]

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [resumoRes, despesasRes, faturamentosRes] = await Promise.all([
        axios.get(`/api/despesas/${veterinarioId}/resumo`),
        axios.get(`/api/despesas/${veterinarioId}`),
        axios.get('/api/faturamento')
      ])

      if (resumoRes.data.sucesso) {
        setResumo(resumoRes.data.data)
      }
      if (despesasRes.data.sucesso) {
        setDespesas(despesasRes.data.data || [])
      }
      if (faturamentosRes.data.sucesso) {
        setFaturamentos(faturamentosRes.data.data || [])
      }
    } catch (err) {
      setError('Erro ao carregar dados financeiros')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteDespesa = async (id) => {
    if (confirm('Deseja deletar esta despesa?')) {
      try {
        await axios.delete(`/api/despesas/${id}`)
        await fetchData()
      } catch (err) {
        setError('Erro ao deletar despesa')
      }
    }
  }

  const handleChangeStatusFaturamento = async (faturamentoId, novoStatus) => {
    try {
      const res = await axios.put(`/api/faturamento/${faturamentoId}`, {
        status: novoStatus
      })
      if (res.data.sucesso) {
        setError('')
        await fetchData()
      }
    } catch (err) {
      setError('Erro ao atualizar status do faturamento')
      console.error(err)
    }
  }

  const handleAbrirPagamentoModal = (faturamento) => {
    setFaturamentoSelecionado(faturamento)
    setShowPagamentoModal(true)
  }

  const handleAbrirHistoricoModal = (faturamento) => {
    console.log('Abrindo histórico:', faturamento)
    setFaturamentoSelecionado(faturamento)
    setShowHistoricoModal(true)
  }

  const handleHistoricoSuccess = () => {
    // Quando um pagamento é registrado no histórico, recarrega tudo
    fetchData()
  }

  const handlePagamentoSuccess = () => {
    fetchData()
  }

  const totalRecebido = faturamentos
    .filter(f => f.status === 'Pago')
    .reduce((sum, f) => sum + parseFloat(f.valor || 0), 0)

  const totalAReceber = faturamentos
    .filter(f => f.status === 'Pendente')
    .reduce((sum, f) => sum + parseFloat(f.valor || 0), 0)

  const totalGastos = despesas.reduce((sum, d) => sum + parseFloat(d.valor || 0), 0)

  const resultadoLiquido = totalRecebido - totalGastos

  if (loading) return <div className="loading">Carregando...</div>

  return (
    <div className="financeiro-container">
      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError('')}>×</button>
        </div>
      )}

      {showPagamentoModal && faturamentoSelecionado && (
        <PagamentoModal
          faturamento={faturamentoSelecionado}
          onClose={() => setShowPagamentoModal(false)}
          onSuccess={handlePagamentoSuccess}
        />
      )}

      {showHistoricoModal && faturamentoSelecionado && (
        <HistoricoPagamentosModal
          faturamento={faturamentoSelecionado}
          onClose={() => setShowHistoricoModal(false)}
          onPaymentSuccess={handleHistoricoSuccess}
        />
      )}

      {showNovaDepesa && (
        <DespesaModal
          isOpen={showNovaDepesa}
          onClose={() => setShowNovaDepesa(false)}
          onSuccess={fetchData}
          veterinarioId={veterinarioId}
          categoriasDespesa={categoriasDespesa}
        />
      )}

      {/* Cards de Resumo */}
      <div className="cards-resumo">
        <div className="card receita">
          <div className="card-icon">💰</div>
          <div className="card-content">
            <p className="card-label">Recebido</p>
            <p className="card-value">R$ {totalRecebido.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
        </div>

        <div className="card pendente">
          <div className="card-icon">⏳</div>
          <div className="card-content">
            <p className="card-label">A Receber</p>
            <p className="card-value">R$ {totalAReceber.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
        </div>

        <div className="card despesa">
          <div className="card-icon">📉</div>
          <div className="card-content">
            <p className="card-label">Gastos</p>
            <p className="card-value">R$ {totalGastos.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
        </div>

        <div className={`card resultado ${resultadoLiquido >= 0 ? 'positivo' : 'negativo'}`}>
          <div className="card-icon">{resultadoLiquido >= 0 ? '📈' : '📉'}</div>
          <div className="card-content">
            <p className="card-label">Resultado Líquido</p>
            <p className="card-value">R$ {resultadoLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
        </div>

        {/* Card de Gastos por Categoria - Pizza Chart Compacto */}
        {resumo?.porCategoria && Object.keys(resumo.porCategoria).length > 0 && (
          <GastosCategoriaPieChartCard
            porCategoria={resumo.porCategoria}
            totalGastos={totalGastos}
          />
        )}
      </div>

      {/* Seção de Despesas */}
      <div className="despesas-section">
        <div className="despesas-header">
          <h2>💸 Despesas</h2>
          <button
            className="btn-primary"
            onClick={() => setShowNovaDepesa(true)}
          >
            + Nova Despesa
          </button>
        </div>

        {despesas.length === 0 ? (
          <p className="empty-message">Nenhuma despesa registrada</p>
        ) : (
          <div className="despesas-list">
            {despesas.map(despesa => (
              <div key={despesa.id} className="despesa-item">
                <div className="despesa-info">
                  <div className="despesa-col-categoria">
                    <span>💰 {despesa.categoriaDespesa}</span>
                  </div>
                  <div className="despesa-col-descricao">
                    <span>📝 {despesa.descricao}</span>
                  </div>
                  <div className="despesa-col-data">
                    <span>📅 {formatarData(despesa.data)}</span>
                  </div>
                </div>
                <div className="despesa-valor">
                  <span className="valor">R$ {parseFloat(despesa.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  <button
                    className="btn-delete"
                    onClick={() => handleDeleteDespesa(despesa.id)}
                    title="Deletar despesa"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Seção de Faturamentos */}
      <div className="faturamentos-section">
        <div className="faturamentos-header">
          <h2>📊 Faturamentos</h2>
        </div>

        <div className="filtro-status">
          {['Todos', 'Pago', 'Parcialmente Pago', 'Pendente'].map(status => (
            <button
              key={status}
              className={`filter-btn ${filtroStatus === status ? 'active' : ''}`}
              onClick={() => setFiltroStatus(status)}
            >
              {status}
            </button>
          ))}
        </div>

        {faturamentos.length === 0 ? (
          <p className="empty-message">Nenhum faturamento registrado</p>
        ) : (
          <div className="faturamentos-list">
            {faturamentos
              .filter(f => filtroStatus === 'Todos' || f.status === filtroStatus)
              .map(fat => (
                <div key={fat.id} className="faturamento-item">
                  <div className="faturamento-info">
                    <div className="faturamento-col-cliente">
                      <span>👤 {fat.Cliente?.nome}</span>
                    </div>
                    <div className="faturamento-col-data">
                      <span>📅 {fat.HistoricoConsulta?.data
                        ? formatarData(fat.HistoricoConsulta.data)
                        : formatarData(fat.dataEmissao || fat.createdAt)}
                      </span>
                    </div>
                    <div className="faturamento-col-tipo">
                      <span>🏥 {fat.descricao}</span>
                    </div>
                    <div className="faturamento-col-animal">
                      <span>🐾 {fat.HistoricoConsulta?.Pet?.nome || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="faturamento-valor-acoes">
                    <div className="faturamento-valor">
                      <div className="valor-info">
                        <span className="valor">R$ {parseFloat(fat.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        {fat.status === 'Parcialmente Pago' && (
                          <div className="parcial-info">
                            <span className="recebido">Recebido: R$ {parseFloat(fat.valorRecebido || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            <span className="faltante">Falta: R$ {(parseFloat(fat.valor) - parseFloat(fat.valorRecebido || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="faturamento-acoes">
                      <button
                        className="btn-historico"
                        onClick={() => handleAbrirHistoricoModal(fat)}
                        title="Ver histórico de pagamentos"
                      >
                        📋
                      </button>
                    {fat.status === 'Pago' ? (
                      <button
                        className="btn-marcar-pendente"
                        onClick={() => handleChangeStatusFaturamento(fat.id, 'Pendente')}
                        title="Marcar como pendente"
                      >
                        ✅ PAGO
                      </button>
                    ) : fat.status === 'Parcialmente Pago' ? (
                      <button
                        className="btn-marcar-pago"
                        onClick={() => handleAbrirHistoricoModal(fat)}
                        title="Ver histórico de pagamentos"
                      >
                        📊 PARCIAL
                      </button>
                    ) : (
                      <button
                        className="btn-marcar-pago"
                        onClick={() => handleAbrirPagamentoModal(fat)}
                        title="Registrar pagamento"
                      >
                        ⏳ PENDENTE
                      </button>
                    )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}
