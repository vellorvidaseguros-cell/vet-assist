import { useState, useEffect, useMemo } from 'react'
import axios from 'axios'
import PagamentoModal from './PagamentoModal'
import './MobileCobrancas.css'

const MESES_NOMES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

export default function MobileCobrancas() {
  const [faturamentos, setFaturamentos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filtro, setFiltro] = useState('Pendente')
  const [pagamentoModalFat, setPagamentoModalFat] = useState(null)
  const [showMesSeletor, setShowMesSeletor] = useState(false)
  const hoje = new Date()
  // null = todos os meses; objeto = mês específico
  const [mesSelecionado, setMesSelecionado] = useState({ mes: hoje.getMonth(), ano: hoje.getFullYear() })

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

  // Extrair data do faturamento de forma segura (usa dataEmissao ou createdAt)
  const getDataFaturamento = (f) => {
    const raw = f.dataEmissao || f.createdAt
    if (!raw) return new Date()
    const str = typeof raw === 'string' ? raw : new Date(raw).toISOString()
    const [y, m, d] = str.substring(0, 10).split('-').map(Number)
    return new Date(y, m - 1, d)
  }

  // Gerar lista de meses disponíveis nos dados (com faturamentos)
  const mesesDisponiveis = useMemo(() => {
    const mesesSet = new Set()
    faturamentos.forEach(f => {
      const d = getDataFaturamento(f)
      mesesSet.add(`${d.getFullYear()}-${d.getMonth()}`)
    })
    // Sempre incluir o mês atual
    mesesSet.add(`${hoje.getFullYear()}-${hoje.getMonth()}`)

    return Array.from(mesesSet)
      .map(key => {
        const [ano, mes] = key.split('-').map(Number)
        return { mes, ano, label: `${MESES_NOMES[mes]} ${ano}` }
      })
      .sort((a, b) => b.ano !== a.ano ? b.ano - a.ano : b.mes - a.mes)
  }, [faturamentos])

  // Faturamentos do período selecionado (null = todos)
  const faturamentosDoMes = useMemo(() => {
    if (!mesSelecionado) return faturamentos
    return faturamentos.filter(f => {
      const d = getDataFaturamento(f)
      return d.getMonth() === mesSelecionado.mes && d.getFullYear() === mesSelecionado.ano
    })
  }, [faturamentos, mesSelecionado])

  // Lista filtrada por status E pelo mês selecionado
  const faturamentosFiltrados = useMemo(() => faturamentosDoMes.filter(f => {
    if (filtro === 'Todos') return true
    return f.status === filtro
  }), [faturamentosDoMes, filtro])

  // À Receber = pendentes + saldo remanescente de parcialmente pagos
  const totalPendente = useMemo(() =>
    faturamentosDoMes.reduce((sum, f) => {
      if (f.status === 'Pendente') {
        return sum + parseFloat(f.valor || 0)
      }
      if (f.status === 'Parcialmente Pago') {
        const saldo = parseFloat(f.valor || 0) - parseFloat(f.valorRecebido || 0)
        return sum + saldo
      }
      return sum
    }, 0)
  , [faturamentosDoMes])

  // Total faturado no período
  const totalFaturamentoMes = useMemo(() =>
    faturamentosDoMes.reduce((sum, f) => sum + parseFloat(f.valor || 0), 0)
  , [faturamentosDoMes])

  // Total recebido no período (Pago ou Parcialmente Pago)
  const totalRecebidoMes = useMemo(() =>
    faturamentosDoMes
      .filter(f => f.status === 'Pago' || f.status === 'Parcialmente Pago')
      .reduce((sum, f) => sum + parseFloat(f.valorRecebido || f.valor || 0), 0)
  , [faturamentosDoMes])

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

      {/* Seletor de mês - overlay */}
      {showMesSeletor && (
        <div className="mes-seletor-overlay" onClick={() => setShowMesSeletor(false)}>
          <div className="mes-seletor-menu" onClick={e => e.stopPropagation()}>
            <div className="mes-seletor-titulo">Selecionar Mês</div>
            <button
              className={`mes-seletor-opcao ${!mesSelecionado ? 'ativo' : ''}`}
              onClick={() => { setMesSelecionado(null); setShowMesSeletor(false) }}
            >
              📋 Todos os meses
            </button>
            {mesesDisponiveis.map(({ mes, ano, label }) => (
              <button
                key={`${ano}-${mes}`}
                className={`mes-seletor-opcao ${mesSelecionado && mesSelecionado.mes === mes && mesSelecionado.ano === ano ? 'ativo' : ''}`}
                onClick={() => { setMesSelecionado({ mes, ano }); setShowMesSeletor(false) }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Resumo */}
      <div className="mobile-cobrancas-resumo">
        {/* Card clicável — abre seletor de mês */}
        <div
          className="resumo-card resumo-faturamento-mes clicavel"
          onClick={() => setShowMesSeletor(true)}
        >
          <span className="resumo-label">Faturamento ▾</span>
          <span className="resumo-mes-nome">{mesSelecionado ? MESES_NOMES[mesSelecionado.mes] : 'Todos'}</span>
          <span className="resumo-valor">
            R$ {totalFaturamentoMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="resumo-card resumo-faturado-hoje">
          <span className="resumo-label">Recebido</span>
          <span className="resumo-mes-nome">{mesSelecionado ? MESES_NOMES[mesSelecionado.mes] : 'Todos'}</span>
          <span className="resumo-valor">
            R$ {totalRecebidoMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="resumo-card resumo-a-receber">
          <span className="resumo-label">À Receber</span>
          <span className="resumo-mes-nome">{mesSelecionado ? MESES_NOMES[mesSelecionado.mes] : 'Todos'}</span>
          <span className="resumo-valor">
            R$ {totalPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
          {faturamentosFiltrados.map(cobranca => {
            // Formatar data do agendamento/consulta
            const dataRaw = cobranca.HistoricoConsulta?.data || cobranca.dataEmissao || cobranca.createdAt
            const dataFormatada = (() => {
              if (!dataRaw) return null
              const str = typeof dataRaw === 'string' ? dataRaw : new Date(dataRaw).toISOString()
              const [y, m, d] = str.substring(0, 10).split('-').map(Number)
              return new Date(y, m - 1, d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
            })()

            // Data do pagamento (se já pago)
            const dataPagRaw = cobranca.dataPagamento || cobranca.dataUltimoPagamento
            const dataPagFormatada = (() => {
              if (!dataPagRaw) return null
              const str = typeof dataPagRaw === 'string' ? dataPagRaw : new Date(dataPagRaw).toISOString()
              const [y, m, d] = str.substring(0, 10).split('-').map(Number)
              return new Date(y, m - 1, d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
            })()

            return (
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
                    🐾 {cobranca.HistoricoConsulta?.Pet?.nome || cobranca.descricao || 'Pet'}
                  </div>
                  <div className="cobranca-valor">
                    R$ {parseFloat(cobranca.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                {/* Datas */}
                <div className="cobranca-datas">
                  {dataFormatada && (
                    <span className="cobranca-data-item">📅 Consulta: {dataFormatada}</span>
                  )}
                  {dataPagFormatada && (
                    <span className="cobranca-data-item cobranca-data-pago">✅ Pago em: {dataPagFormatada}</span>
                  )}
                </div>

                {(cobranca.status === 'Pendente' || cobranca.status === 'Parcialmente Pago') && (
                  <button
                    className="cobranca-btn-pagar"
                    onClick={() => setPagamentoModalFat(cobranca)}
                  >
                    {cobranca.status === 'Pendente' ? 'Registrar Pagamento' : 'Adicionar Pagamento'}
                  </button>
                )}
              </div>
            )
          })}
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
