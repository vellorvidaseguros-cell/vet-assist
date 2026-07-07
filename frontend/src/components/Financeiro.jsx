import { useState, useEffect } from 'react'
import axios from 'axios'
import { formatarData } from '../utils/dateFormatter'
import PagamentoModal from './PagamentoModal'
import HistoricoPagamentosModal from './HistoricoPagamentosModal'
import DespesaModal from './DespesaModal'
import GastosCategoriaPieChartCard from './GastosCategoriaPieChartCard'
import ConfirmModal from './ConfirmModal'
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
  const [confirm, setConfirm] = useState({ open: false })
  const [precificacao, setPrecificacao] = useState(null)
  const [custoVeiculoMensal, setCustoVeiculoMensal] = useState(0)

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

      // Dados para o resumo de lucratividade (roda em paralelo, sem travar a tela)
      carregarLucratividade()
    } catch (err) {
      setError('Erro ao carregar dados financeiros')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Lucratividade é opcional e não deve travar o carregamento do Financeiro,
  // por isso roda separada e sem await na fetchData principal.
  const carregarLucratividade = async () => {
    try {
      const perfilRes = await axios.get('/api/perfil')
      if (!perfilRes.data.sucesso) return
      setPrecificacao(perfilRes.data.data?.precificacao || null)
      const vetId = perfilRes.data.data?.id
      if (!vetId) return
      const veic = await axios.get(`/api/veiculos/${vetId}`).catch(() => null)
      const veiculo = veic?.data?.data
      if (!veiculo?.id) return
      const custoRes = await axios.get(`/api/veiculos/${veiculo.id}/custo-km`).catch(() => null)
      if (custoRes?.data?.sucesso && !custoRes.data.data.configuracaoPendente) {
        setCustoVeiculoMensal(parseFloat(custoRes.data.data.totalCustoMensal) || 0)
      }
    } catch (e) {
      // silencioso — lucratividade é complementar
    }
  }

  const handleDeleteDespesa = (id) => {
    setConfirm({
      open: true,
      title: 'Deletar Despesa',
      message: 'Tem certeza que deseja deletar esta despesa? Você pode restaurá-la na Lixeira depois, se precisar.',
      confirmText: 'Deletar',
      cancelText: 'Cancelar',
      confirmColor: 'danger',
      onConfirm: async () => {
        try {
          await axios.delete(`/api/despesas/${id}`)
          await fetchData()
          setConfirm({ open: false })
        } catch (err) {
          setError('Erro ao deletar despesa')
          setConfirm({ open: false })
        }
      },
      onCancel: () => setConfirm({ open: false })
    })
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

  // ===== Lucratividade do MÊS ATUAL (automático, sem input do usuário) =====
  const agora = new Date()
  const mesAtual = agora.getMonth()
  const anoAtual = agora.getFullYear()
  const noMesAtual = (data) => {
    if (!data) return false
    const d = new Date(data)
    return d.getMonth() === mesAtual && d.getFullYear() === anoAtual
  }

  // Receita: cobranças pagas no mês (usa dataPagamento; cai para dataEmissao se ausente)
  const recebidoMes = faturamentos
    .filter(f => f.status === 'Pago' && noMesAtual(f.dataPagamento || f.dataEmissao))
    .reduce((s, f) => s + parseFloat(f.valorRecebido || f.valor || 0), 0)

  const despesasMes = despesas
    .filter(d => noMesAtual(d.data))
    .reduce((s, d) => s + parseFloat(d.valor || 0), 0)

  // Lucro real = receita − despesas gerais − custo do veículo do mês
  const lucroReal = recebidoMes - despesasMes - custoVeiculoMensal

  // Meta de pró-labore (definida na Precificação)
  const metaProLabore = parseFloat(precificacao?.proLaboreDesejado) || 0
  const horaTecnica = parseFloat(precificacao?.horaTecnica) || 0
  const temPrecificacao = metaProLabore > 0

  const fmt = (n) => (n || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const nomeMes = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'][mesAtual]

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

      <ConfirmModal {...confirm} />

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

      {/* ===== Lucratividade do Mês (automático) ===== */}
      <div className="lucratividade-section">
        <div className="lucratividade-header">
          <h2>📊 Lucratividade — {nomeMes}/{anoAtual}</h2>
        </div>

        <div className="lucratividade-fluxo">
          <div className="luc-item">
            <span className="luc-label">Recebido no mês</span>
            <span className="luc-valor positivo">+ R$ {fmt(recebidoMes)}</span>
          </div>
          <div className="luc-op">−</div>
          <div className="luc-item">
            <span className="luc-label">Despesas do mês</span>
            <span className="luc-valor negativo">R$ {fmt(despesasMes)}</span>
          </div>
          <div className="luc-op">−</div>
          <div className="luc-item">
            <span className="luc-label">Custo do veículo</span>
            <span className="luc-valor negativo">R$ {fmt(custoVeiculoMensal)}</span>
            {custoVeiculoMensal === 0 && (
              <span className="luc-aviso">configure o veículo</span>
            )}
          </div>
          <div className="luc-op">=</div>
          <div className={`luc-item luc-resultado ${lucroReal >= 0 ? 'positivo' : 'negativo'}`}>
            <span className="luc-label">Lucro real</span>
            <span className="luc-valor-grande">R$ {fmt(lucroReal)}</span>
          </div>
        </div>

        {/* Comparação com a meta de pró-labore */}
        {temPrecificacao ? (
          <div className="lucratividade-meta">
            {lucroReal >= metaProLabore ? (
              <p className="meta-ok">
                🎉 Você já atingiu sua meta de pró-labore (R$ {fmt(metaProLabore)}) este mês!
              </p>
            ) : (
              <p className="meta-faltando">
                🎯 Faltam <strong>R$ {fmt(metaProLabore - lucroReal)}</strong> para atingir sua meta de pró-labore de R$ {fmt(metaProLabore)} este mês.
                {horaTecnica > 0 && (
                  <> Isso equivale a ~<strong>{Math.ceil((metaProLabore - lucroReal) / horaTecnica)}h</strong> de atendimento.</>
                )}
              </p>
            )}
          </div>
        ) : (
          <div className="lucratividade-meta lucratividade-meta-neutra">
            <p>
              💡 Configure sua <strong>Precificação</strong> no Perfil para comparar seu lucro com a meta de quanto você quer ganhar por mês.
            </p>
          </div>
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
