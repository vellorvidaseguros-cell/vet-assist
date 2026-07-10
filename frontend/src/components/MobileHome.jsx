import { useState, useEffect } from 'react'
import axios from 'axios'
import { formatarData } from '../utils/dateFormatter'
import MobileAgendamentosCard from './MobileAgendamentosCard'
import FAB from './FAB'
import MobileSearch from './MobileSearch'
import WeatherInfo from './WeatherInfo'
import NovoClienteModal from './NovoClienteModal'
import NovoAgendamentoModal from './NovoAgendamentoModal'
import NovaCobrancaModal from './NovaCobrancaModal'
import SelecionarAnimalOrcamentoModal from './SelecionarAnimalOrcamentoModal'
import QuoteModal from './QuoteModal'
import './MobileHome.css'

// Cache local dos dados da agenda — permite mostrar a tela na hora ao reabrir o
// app (o iOS descarta a página em background e recarregaria do zero sem isso).
const CACHE_AGENDA = 'cache_agendamentos'
const CACHE_FATURAMENTO = 'cache_faturamentos'

const lerCache = (chave) => {
  try {
    const raw = localStorage.getItem(chave)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export default function MobileHome() {
  // Força rebuild - v2.1
  // Inicializa com o cache (se existir) para renderizar instantaneamente
  const cacheAgenda = lerCache(CACHE_AGENDA)
  const cacheFat = lerCache(CACHE_FATURAMENTO)
  const [agendamentos, setAgendamentos] = useState(cacheAgenda || [])
  const [faturamentos, setFaturamentos] = useState(cacheFat || [])
  // Só mostra "Carregando..." se NÃO houver cache; com cache, atualiza em background
  const [loading, setLoading] = useState(!cacheAgenda)
  const [error, setError] = useState('')
  const [abaAtiva, setAbaAtiva] = useState('proximos') // 'proximos', 'futuros', 'passados'
  const [statusFilter, setStatusFilter] = useState([]) // filtro de status selecionados
  const [showFilterMenu, setShowFilterMenu] = useState(false)
  const [dataAtual, setDataAtual] = useState(new Date())
  const [searchAtivo, setSearchAtivo] = useState(false)
  const [searchResultados, setSearchResultados] = useState([])
  const [showFABMenu, setShowFABMenu] = useState(false)
  const [showNovoClienteModal, setShowNovoClienteModal] = useState(false)
  const [showNovoAgendamento, setShowNovoAgendamento] = useState(false)
  const [showNovaCobranca, setShowNovaCobranca] = useState(false)
  const [showSelecionarOrcamento, setShowSelecionarOrcamento] = useState(false)
  const [orcamentoAlvo, setOrcamentoAlvo] = useState(null) // { cliente, pet }

  const veterinarioId = 1

  useEffect(() => {
    fetchData()
    // Atualizar data a cada minuto
    const interval = setInterval(() => setDataAtual(new Date()), 60000)
    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    try {
      // Só bloqueia com "Carregando..." se ainda não temos nada em tela
      if (agendamentos.length === 0) setLoading(true)
      const [agendamentosRes, faturamentosRes] = await Promise.all([
        axios.get('/api/agendamentos'),
        axios.get('/api/faturamento')
      ])

      if (agendamentosRes.data.sucesso) {
        const dados = agendamentosRes.data.data || []
        setAgendamentos(dados)
        try { localStorage.setItem(CACHE_AGENDA, JSON.stringify(dados)) } catch {}
      }
      if (faturamentosRes.data.sucesso) {
        const dados = faturamentosRes.data.data || []
        setFaturamentos(dados)
        try { localStorage.setItem(CACHE_FATURAMENTO, JSON.stringify(dados)) } catch {}
      }
    } catch (err) {
      // Se já temos cache em tela, não mostra erro em cima de dados válidos
      if (agendamentos.length === 0) setError('Erro ao carregar agendamentos')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Obter data em formato Date sem hora (corrige bug de fuso horário)
  const getDataSemHora = (data) => {
    if (!data) return new Date(NaN)
    // Se for string no formato YYYY-MM-DD, parsear como data local (evita UTC shift)
    if (typeof data === 'string' && /^\d{4}-\d{2}-\d{2}/.test(data)) {
      const [year, month, day] = data.substring(0, 10).split('-').map(Number)
      return new Date(year, month - 1, day)
    }
    const d = new Date(data)
    return new Date(d.getFullYear(), d.getMonth(), d.getDate())
  }

  const hoje = getDataSemHora(dataAtual)
  const amanha = new Date(hoje)
  amanha.setDate(amanha.getDate() + 1)

  const inicioSemana = new Date(hoje)
  inicioSemana.setDate(inicioSemana.getDate() - hoje.getDay())

  const fimSemana = new Date(inicioSemana)
  fimSemana.setDate(fimSemana.getDate() + 6)

  // Filtrar agendamentos por período (campos corretos do backend: data, hora)
  const agendasHoje = agendamentos.filter(a => {
    const dataAgenda = getDataSemHora(a.data)
    return dataAgenda.getTime() === hoje.getTime()
  }).sort((a, b) => new Date(`2000-01-01 ${a.hora || '00:00'}`) - new Date(`2000-01-01 ${b.hora || '00:00'}`))

  const agendasAmanha = agendamentos.filter(a => {
    const dataAgenda = getDataSemHora(a.data)
    return dataAgenda.getTime() === amanha.getTime()
  }).sort((a, b) => new Date(`2000-01-01 ${a.hora || '00:00'}`) - new Date(`2000-01-01 ${b.hora || '00:00'}`))

  const agendasSemana = agendamentos.filter(a => {
    const dataAgenda = getDataSemHora(a.data)
    return dataAgenda >= inicioSemana && dataAgenda <= fimSemana
  }).sort((a, b) => new Date(`2000-01-01 ${a.hora || '00:00'}`) - new Date(`2000-01-01 ${b.hora || '00:00'}`))

  const agendasPassados = agendamentos.filter(a => {
    const dataAgenda = getDataSemHora(a.data)
    return dataAgenda.getTime() < hoje.getTime()
  }).sort((a, b) => getDataSemHora(b.data) - getDataSemHora(a.data)) // mais recentes primeiro

  const agendasProximos = agendamentos.filter(a => {
    const dataAgenda = getDataSemHora(a.data)
    return dataAgenda.getTime() > amanha.getTime() // a partir de depois de amanhã
  }).sort((a, b) => getDataSemHora(a.data) - getDataSemHora(b.data)) // mais próximos primeiro

  // Filtrar agendamentos para exibição baseado na aba ativa
  let agendasParaExibir = abaAtiva === 'proximos'
    ? agendasHoje
    : abaAtiva === 'amanha'
    ? agendasAmanha
    : abaAtiva === 'futuros'
    ? agendasProximos
    : agendasPassados

  // Aplicar filtro de status se houver algum selecionado
  if (statusFilter.length > 0) {
    agendasParaExibir = agendasParaExibir.filter(a => statusFilter.includes(a.status))
  }

  // Calcular pendências: pendentes (valor cheio) + saldo restante das parcialmente pagas
  const totalPendente = faturamentos.reduce((sum, f) => {
    if (f.status === 'Pendente') return sum + parseFloat(f.valor || 0)
    if (f.status === 'Parcialmente Pago') return sum + (parseFloat(f.valor || 0) - parseFloat(f.valorRecebido || 0))
    return sum
  }, 0)

  const retornosAgendar = agendamentos
    .filter(a => a.status === 'Pendente')
    .length

  // Cobranças com data de vencimento definida: vencidas primeiro, depois as
  // que vencem em breve (próximos 7 dias) — pra aparecer na Agenda sem
  // precisar esperar a notificação do job do backend.
  const cobrancasVencendo = faturamentos
    .filter(f => (f.status === 'Pendente' || f.status === 'Parcialmente Pago') && f.dataVencimento)
    .map(f => {
      const dataVenc = getDataSemHora(f.dataVencimento)
      const diffDias = Math.round((dataVenc.getTime() - hoje.getTime()) / 86400000)
      return { ...f, diffDias }
    })
    .filter(f => f.diffDias <= 7)
    .sort((a, b) => a.diffDias - b.diffDias)

  // Formatar data para exibição
  const formatarDataCompleta = (data) => {
    const d = new Date(data)
    const dias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
    const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']

    return `${dias[d.getDay()]}, ${d.getDate()} de ${meses[d.getMonth()]}`
  }

  const handleBusca = (resultados) => {
    setSearchResultados(resultados)
  }

  const toggleStatusFilter = (status) => {
    setStatusFilter(prev => {
      if (prev.includes(status)) {
        return prev.filter(s => s !== status)
      } else {
        return [...prev, status]
      }
    })
  }

  const handleVerTodasCobancas = () => {
    // Navegar para a aba de Cobranças
    window.dispatchEvent(new CustomEvent('navegarPara', { detail: 'financeiro' }))
  }

  const handleVerTodosRetornos = () => {
    // Navegar para a aba de Clientes
    window.dispatchEvent(new CustomEvent('navegarPara', { detail: 'clientes' }))
  }

  const handleFABNovoAgendamento = () => {
    setShowNovoAgendamento(true)
    setShowFABMenu(false)
  }

  const handleFABNovoCliente = () => {
    setShowNovoClienteModal(true)
    setShowFABMenu(false)
  }

  const handleFABNovaCobranca = () => {
    setShowNovaCobranca(true)
    setShowFABMenu(false)
  }

  const handleFABHistorico = () => {
    window.dispatchEvent(new CustomEvent('navegarPara', { detail: 'historico' }))
    setShowFABMenu(false)
  }

  const handleFABOrcamento = () => {
    setShowSelecionarOrcamento(true)
    setShowFABMenu(false)
  }

  const handleAnimalSelecionadoParaOrcamento = (cliente, pet) => {
    setShowSelecionarOrcamento(false)
    setOrcamentoAlvo({ cliente, pet })
  }

  if (loading) {
    return <div className="mobile-loading">Carregando...</div>
  }

  // Se está em modo busca, mostrar resultados
  if (searchAtivo) {
    return (
      <div className="mobile-home">
        <div className="mobile-header">
          <h1>VetAssist</h1>
          <span className="mobile-hora">
            {dataAtual.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        <MobileSearch
          onSearch={handleBusca}
          onClose={() => setSearchAtivo(false)}
          autoFocus
        />
      </div>
    )
  }

  return (
    <div className="mobile-home">
      {showNovoClienteModal && (
        <NovoClienteModal
          onClose={() => setShowNovoClienteModal(false)}
          onSuccess={() => {
            setShowNovoClienteModal(false)
            fetchData()
          }}
        />
      )}

      {showNovoAgendamento && (
        <NovoAgendamentoModal
          onClose={() => setShowNovoAgendamento(false)}
          onSuccess={() => {
            setShowNovoAgendamento(false)
            fetchData()
          }}
        />
      )}

      {showNovaCobranca && (
        <NovaCobrancaModal
          onClose={() => setShowNovaCobranca(false)}
          onSuccess={() => {
            setShowNovaCobranca(false)
            fetchData()
          }}
        />
      )}

      {error && (
        <div className="mobile-error">
          {error}
          <button onClick={() => setError('')}>×</button>
        </div>
      )}

      {/* Header */}
      <div className="mobile-header">
        <h1>VetAssist</h1>
        <WeatherInfo />
      </div>

      {/* Título da seção + Abas (bloco sticky) */}
      <div className="mobile-title-tabs-wrapper">
        <div className="mobile-title">
          <h2>HOJE - {formatarDataCompleta(hoje)}</h2>
        </div>

        {/* Abas */}
        <div className="mobile-tabs">
          <button
            className={`mobile-tab ${abaAtiva === 'proximos' ? 'ativo' : ''}`}
            onClick={() => setAbaAtiva('proximos')}
          >
            Hoje
          </button>
          <button
            className={`mobile-tab ${abaAtiva === 'futuros' ? 'ativo' : ''}`}
            onClick={() => setAbaAtiva('futuros')}
          >
            Próximos
          </button>
          <button
            className={`mobile-tab ${abaAtiva === 'passados' ? 'ativo' : ''}`}
            onClick={() => setAbaAtiva('passados')}
          >
            Anteriores
          </button>
          <button
            type="button"
            className={`mobile-tab mobile-tab-filtro ${showFilterMenu ? 'ativo' : ''} ${statusFilter.length > 0 ? 'has-filter' : ''}`}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              console.log('[FILTRO] Click - showFilterMenu antes:', showFilterMenu)
              setShowFilterMenu(prev => !prev)
            }}
            title="Filtrar por status"
            aria-label="Filtrar agendamentos"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
            </svg>
            {statusFilter.length > 0 && <span className="filter-badge">{statusFilter.length}</span>}
          </button>
        </div>
      </div>

      {/* Menu de Filtros (dropdown) */}
      {showFilterMenu && (
        <>
          <div className="filter-menu-backdrop" onClick={() => setShowFilterMenu(false)} />
          <div className="filter-menu-dropdown">
            <div className="filter-menu-header">
              <span>Filtrar por status</span>
              {statusFilter.length > 0 && (
                <button
                  className="filter-clear-link"
                  onClick={() => { setStatusFilter([]); }}
                >
                  Limpar
                </button>
              )}
            </div>
            <button
              className={`filter-menu-item ${statusFilter.includes('Pendente') ? 'ativo' : ''}`}
              onClick={() => toggleStatusFilter('Pendente')}
            >
              <span className="filter-check">{statusFilter.includes('Pendente') ? '✓' : ''}</span>
              Pendente
            </button>
            <button
              className={`filter-menu-item ${statusFilter.includes('Confirmado') ? 'ativo' : ''}`}
              onClick={() => toggleStatusFilter('Confirmado')}
            >
              <span className="filter-check">{statusFilter.includes('Confirmado') ? '✓' : ''}</span>
              Confirmado
            </button>
            <button
              className={`filter-menu-item ${statusFilter.includes('Concluído') ? 'ativo' : ''}`}
              onClick={() => toggleStatusFilter('Concluído')}
            >
              <span className="filter-check">{statusFilter.includes('Concluído') ? '✓' : ''}</span>
              Concluído
            </button>
            <button
              className={`filter-menu-item ${statusFilter.includes('Cancelado') ? 'ativo' : ''}`}
              onClick={() => toggleStatusFilter('Cancelado')}
            >
              <span className="filter-check">{statusFilter.includes('Cancelado') ? '✓' : ''}</span>
              Cancelado
            </button>
            <button
              className={`filter-menu-item ${statusFilter.includes('Reagendado') ? 'ativo' : ''}`}
              onClick={() => toggleStatusFilter('Reagendado')}
            >
              <span className="filter-check">{statusFilter.includes('Reagendado') ? '✓' : ''}</span>
              Reagendado
            </button>
          </div>
        </>
      )}

      {/* Cards de Agendamentos */}
      <div className="mobile-agendamentos-list">
        {agendasParaExibir.length === 0 ? (
          <div className="mobile-empty-state">
            <p>Nenhum agendamento {
              abaAtiva === 'proximos' ? 'para hoje' :
              abaAtiva === 'futuros' ? 'agendado para os próximos dias' :
              'em datas anteriores'
            }{statusFilter.length > 0 ? ' com os filtros aplicados' : ''}</p>
          </div>
        ) : (
          agendasParaExibir.map(agendamento => (
            <MobileAgendamentosCard
              key={agendamento.id}
              agendamento={agendamento}
              onStatusChange={fetchData}
              mostrarData={abaAtiva === 'passados' || abaAtiva === 'futuros'}
            />
          ))
        )}
      </div>

      {/* Seção de Pendências */}
      <div className="mobile-pendencias">
        <h3>PENDÊNCIAS</h3>

        <div className="pendencia-item">
          <div className="pendencia-top">
            <span className="pendencia-label">Em cobranças</span>
            <button className="pendencia-link" onClick={handleVerTodasCobancas}>
              Ver todas
            </button>
          </div>
          <span className="pendencia-valor">
            R$ {totalPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="pendencia-nota">Todas as cobranças em aberto, de qualquer período</span>
        </div>

        {cobrancasVencendo.length > 0 && (
          <div className="vencimentos-lista">
            {cobrancasVencendo.map(f => {
              const clienteNome = f.Cliente?.nome || f.HistoricoConsulta?.Cliente?.nome || 'Cliente'
              const vencida = f.diffDias < 0
              const hojeVenc = f.diffDias === 0
              let quando
              if (vencida) quando = `Venceu há ${Math.abs(f.diffDias)} dia(s)`
              else if (hojeVenc) quando = 'Vence hoje'
              else quando = `Vence em ${f.diffDias} dia(s)`

              return (
                <button
                  key={f.id}
                  className={`vencimento-item ${vencida ? 'vencido' : hojeVenc ? 'hoje' : ''}`}
                  onClick={handleVerTodasCobancas}
                >
                  <span className="vencimento-cliente">{clienteNome}</span>
                  <span className="vencimento-info">
                    <span className="vencimento-quando">{quando}</span>
                    <span className="vencimento-valor">
                      R$ {parseFloat(f.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Busca Rápida */}
      <div className="mobile-search-section">
        <h3>BUSCAR</h3>
        <button
          className="mobile-search-input"
          onClick={() => setSearchAtivo(true)}
        >
          Buscar cliente, pet, consulta...
        </button>
      </div>

      {/* FAB - Floating Action Button */}
      <FAB
        onMenuToggle={setShowFABMenu}
        showMenu={showFABMenu}
        onNovoAgendamento={handleFABNovoAgendamento}
        onNovoCliente={handleFABNovoCliente}
        onNovaCobranca={handleFABNovaCobranca}
        onHistorico={handleFABHistorico}
        onOrcamento={handleFABOrcamento}
      />

      {showSelecionarOrcamento && (
        <SelecionarAnimalOrcamentoModal
          onClose={() => setShowSelecionarOrcamento(false)}
          onSelecionar={handleAnimalSelecionadoParaOrcamento}
        />
      )}

      {orcamentoAlvo && (
        <QuoteModal
          cliente={orcamentoAlvo.cliente}
          pet={orcamentoAlvo.pet}
          onClose={() => setOrcamentoAlvo(null)}
        />
      )}
    </div>
  )
}
