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
import './MobileHome.css'

export default function MobileHome() {
  // Force rebuild - v2.1
  const [agendamentos, setAgendamentos] = useState([])
  const [faturamentos, setFaturamentos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [abaAtiva, setAbaAtiva] = useState('proximos') // 'proximos', 'amanha', 'semana', 'passados'
  const [dataAtual, setDataAtual] = useState(new Date())
  const [searchAtivo, setSearchAtivo] = useState(false)
  const [searchResultados, setSearchResultados] = useState([])
  const [showFABMenu, setShowFABMenu] = useState(false)
  const [showNovoClienteModal, setShowNovoClienteModal] = useState(false)
  const [showNovoAgendamento, setShowNovoAgendamento] = useState(false)
  const [showNovaCobranca, setShowNovaCobranca] = useState(false)

  const veterinarioId = 1

  useEffect(() => {
    fetchData()
    // Atualizar data a cada minuto
    const interval = setInterval(() => setDataAtual(new Date()), 60000)
    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [agendamentosRes, faturamentosRes] = await Promise.all([
        axios.get('/api/agendamentos'),
        axios.get('/api/faturamento')
      ])

      if (agendamentosRes.data.sucesso) {
        setAgendamentos(agendamentosRes.data.data || [])
      }
      if (faturamentosRes.data.sucesso) {
        setFaturamentos(faturamentosRes.data.data || [])
      }
    } catch (err) {
      setError('Erro ao carregar agendamentos')
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
  const agendasParaExibir = abaAtiva === 'proximos'
    ? agendasHoje
    : abaAtiva === 'amanha'
    ? agendasAmanha
    : abaAtiva === 'futuros'
    ? agendasProximos
    : agendasPassados

  // Calcular pendências
  const totalPendente = faturamentos
    .filter(f => f.status === 'Pendente')
    .reduce((sum, f) => sum + parseFloat(f.valor || 0), 0)

  const retornosAgendar = agendamentos
    .filter(a => a.status === 'Pendente')
    .length

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

        {searchResultados.length > 0 ? (
          <div className="mobile-search-resultados">
            {searchResultados.map(resultado => (
              <div key={resultado.id} className="search-resultado-item">
                <span>{resultado.nome || resultado.descricao}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="mobile-empty-search">
            Nenhum resultado encontrado
          </div>
        )}
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
          <h2>📅 HOJE - {formatarDataCompleta(hoje)}</h2>
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
            className={`mobile-tab ${abaAtiva === 'amanha' ? 'ativo' : ''}`}
            onClick={() => setAbaAtiva('amanha')}
          >
            Amanhã
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
            Passados
          </button>
        </div>
      </div>

      {/* Cards de Agendamentos */}
      <div className="mobile-agendamentos-list">
        {agendasParaExibir.length === 0 ? (
          <div className="mobile-empty-state">
            <p>Nenhum agendamento {
              abaAtiva === 'proximos' ? 'para hoje' :
              abaAtiva === 'amanha' ? 'para amanhã' :
              abaAtiva === 'futuros' ? 'agendado para os próximos dias' :
              'em datas passadas'
            }</p>
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
        <h3>⚠️ PENDÊNCIAS</h3>

        <div className="pendencia-item">
          <div className="pendencia-top">
            <span className="pendencia-label">💰 Em cobranças</span>
            <button className="pendencia-link" onClick={handleVerTodasCobancas}>
              Ver todas
            </button>
          </div>
          <span className="pendencia-valor">
            R$ {totalPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

      </div>

      {/* Busca Rápida */}
      <div className="mobile-search-section">
        <h3>🔍 BUSCAR</h3>
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
      />
    </div>
  )
}
