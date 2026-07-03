import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
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
  const [enviarCobrancaFat, setEnviarCobrancaFat] = useState(null)
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

  // Abrir PDF do histórico em nova aba
  const abrirPDFHistorico = (cobranca) => {
    try {
      const historicoId = cobranca.historicoConsultaId || cobranca.HistoricoConsulta?.id
      if (!historicoId) {
        setError('Esta cobrança não possui histórico vinculado')
        return
      }

      // Abrir PDF em nova aba para visualização.
      // Token via query string porque nova aba não envia o header Authorization.
      const token = localStorage.getItem('token')
      const pdfUrl = `/api/historico/pdf/${historicoId}?token=${encodeURIComponent(token || '')}`
      window.open(pdfUrl, '_blank')
    } catch (err) {
      setError('Erro ao abrir PDF do histórico')
      console.error(err)
    }
  }

  // Construir mensagem de cobrança formatada
  const construirMensagemCobranca = (cobranca) => {
    const clienteNome = cobranca.Cliente?.nome || cobranca.HistoricoConsulta?.Cliente?.nome || 'Cliente'
    const petNome = cobranca.HistoricoConsulta?.Pet?.nome || 'Pet'
    const valor = parseFloat(cobranca.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    const tipo = cobranca.HistoricoConsulta?.tipoAtendimento || cobranca.descricao || 'Atendimento'
    const dataConsulta = cobranca.HistoricoConsulta?.data
      ? new Date(cobranca.HistoricoConsulta.data).toLocaleDateString('pt-BR')
      : ''

    return `Olá ${clienteNome}! 🐾

Segue cobrança referente ao atendimento veterinário:

🐾 Pet: ${petNome}
📋 Serviço: ${tipo}${dataConsulta ? `\n📅 Data: ${dataConsulta}` : ''}
💰 Valor: R$ ${valor}

Por favor, entre em contato para confirmar o pagamento.

Obrigado!`
  }

  // Enviar via WhatsApp
  const enviarWhatsApp = (cobranca) => {
    const telefone = (cobranca.Cliente?.telefone || cobranca.HistoricoConsulta?.Cliente?.telefone || '').replace(/\D/g, '')
    if (!telefone) {
      alert('⚠️ Cliente não possui telefone cadastrado')
      return
    }
    // Adicionar 55 (Brasil) se não tiver
    const numeroLimpo = telefone.startsWith('55') ? telefone : `55${telefone}`
    const mensagem = encodeURIComponent(construirMensagemCobranca(cobranca))
    const url = `https://wa.me/${numeroLimpo}?text=${mensagem}`
    window.open(url, '_blank')
    setEnviarCobrancaFat(null)
  }

  // Enviar via Email
  const enviarEmail = (cobranca) => {
    const email = cobranca.Cliente?.email || cobranca.HistoricoConsulta?.Cliente?.email
    if (!email) {
      alert('⚠️ Cliente não possui email cadastrado')
      return
    }
    const assunto = encodeURIComponent('Cobrança - Atendimento Veterinário')
    const corpo = encodeURIComponent(construirMensagemCobranca(cobranca))
    window.location.href = `mailto:${email}?subject=${assunto}&body=${corpo}`
    setEnviarCobrancaFat(null)
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

            const valorTotal = parseFloat(cobranca.valor)
            const valorRecebido = parseFloat(cobranca.valorRecebido || 0)
            const valorFaltante = valorTotal - valorRecebido

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

                {/* Resumo para Parcialmente Pago */}
                {cobranca.status === 'Parcialmente Pago' && (
                  <div className="cobranca-resumo-parcial">
                    <span>Total: R$ {valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    <span>Pago: R$ {valorRecebido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    <span className="falta">Falta: R$ {valorFaltante.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}

                {/* Datas */}
                <div className="cobranca-datas">
                  {dataFormatada && (
                    <span className="cobranca-data-item">📅 Consulta: {dataFormatada}</span>
                  )}
                  {dataPagFormatada && (
                    <span className="cobranca-data-item cobranca-data-pago">✅ Pago em: {dataPagFormatada}</span>
                  )}
                </div>

                {/* Botões de ação */}
                <div className="cobranca-acoes">
                  <button
                    className="cobranca-btn-detalhes"
                    onClick={() => abrirPDFHistorico(cobranca)}
                    title="Visualizar PDF do histórico"
                  >
                    📋 PDF
                  </button>

                  {(cobranca.status === 'Pendente' || cobranca.status === 'Parcialmente Pago') && (
                    <>
                      <button
                        className="cobranca-btn-enviar"
                        onClick={() => setEnviarCobrancaFat(cobranca)}
                        title="Enviar cobrança"
                      >
                        📤 Enviar
                      </button>
                      <button
                        className="cobranca-btn-pagar"
                        onClick={() => setPagamentoModalFat(cobranca)}
                      >
                        💰 {cobranca.status === 'Pendente' ? 'Registrar' : 'Adicionar'}
                      </button>
                    </>
                  )}
                </div>
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

      {/* Modal de escolha de envio */}
      {enviarCobrancaFat && createPortal(
        <div className="enviar-overlay" onClick={() => setEnviarCobrancaFat(null)}>
          <div className="enviar-modal" onClick={e => e.stopPropagation()}>
            <div className="enviar-header">
              <h3>📤 Enviar Cobrança</h3>
              <p>Como você quer enviar a cobrança?</p>
            </div>

            <div className="enviar-info">
              <div className="enviar-info-row">
                <span className="enviar-info-label">Cliente:</span>
                <span>{enviarCobrancaFat.Cliente?.nome || enviarCobrancaFat.HistoricoConsulta?.Cliente?.nome || '—'}</span>
              </div>
              <div className="enviar-info-row">
                <span className="enviar-info-label">Valor:</span>
                <span className="enviar-info-valor">R$ {parseFloat(enviarCobrancaFat.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div className="enviar-opcoes">
              <button
                className="enviar-opcao-whatsapp"
                onClick={() => enviarWhatsApp(enviarCobrancaFat)}
              >
                <span className="enviar-opcao-icon">💬</span>
                <div className="enviar-opcao-texto">
                  <strong>WhatsApp</strong>
                  <small>{(enviarCobrancaFat.Cliente?.telefone || enviarCobrancaFat.HistoricoConsulta?.Cliente?.telefone) || 'Sem telefone'}</small>
                </div>
              </button>

              <button
                className="enviar-opcao-email"
                onClick={() => enviarEmail(enviarCobrancaFat)}
              >
                <span className="enviar-opcao-icon">📧</span>
                <div className="enviar-opcao-texto">
                  <strong>Email</strong>
                  <small>{(enviarCobrancaFat.Cliente?.email || enviarCobrancaFat.HistoricoConsulta?.Cliente?.email) || 'Sem email'}</small>
                </div>
              </button>
            </div>

            <button
              className="enviar-cancelar"
              onClick={() => setEnviarCobrancaFat(null)}
            >
              Cancelar
            </button>
          </div>
        </div>,
        document.body
      )}

    </div>
  )
}
