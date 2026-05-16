import { useState } from 'react'
import axios from 'axios'
import MobileAgendamentoDetalhes from './MobileAgendamentoDetalhes'
import './MobileAgendamentosCard.css'

export default function MobileAgendamentosCard({ agendamento, onStatusChange, mostrarData = false }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showDetalhes, setShowDetalhes] = useState(false)
  const [showStatusMenu, setShowStatusMenu] = useState(false)

  // Mapeamento de emojis para tipos de pet (campo correto do backend: especie)
  const getPetEmoji = () => {
    const tipo = (agendamento.Pet?.especie || agendamento.Pet?.tipo || '').toLowerCase()
    if (tipo.includes('gato')) return '🐱'
    if (tipo.includes('cachorro') || tipo.includes('cão') || tipo.includes('cao')) return '🐕'
    if (tipo.includes('pássaro') || tipo.includes('ave') || tipo.includes('passaro')) return '🦜'
    if (tipo.includes('coelho')) return '🐰'
    if (tipo.includes('hamster')) return '🐹'
    if (tipo.includes('tartaruga')) return '🐢'
    return '🐾'
  }

  // Obter status visual
  const getStatusDisplay = () => {
    switch (agendamento.status) {
      case 'Pendente':
        return { label: 'Pendente', classe: 'status-pendente' }
      case 'Confirmado':
        return { label: 'Confirmado', classe: 'status-confirmado' }
      case 'Concluído':
        return { label: 'Concluído', classe: 'status-concluido' }
      case 'Cancelado':
        return { label: 'Cancelado', classe: 'status-cancelado' }
      default:
        return { label: agendamento.status, classe: 'status-default' }
    }
  }

  // Função para confirmar agendamento
  const handleConfirmar = async () => {
    if (!confirm('Deseja confirmar este agendamento?')) return

    try {
      setLoading(true)
      await axios.put(`/api/agendamentos/${agendamento.id}`, {
        status: 'Confirmado'
      })
      onStatusChange()
    } catch (err) {
      setError('Erro ao confirmar agendamento')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Função para marcar como concluído
  const handleConcluir = async () => {
    if (!confirm('Deseja marcar este agendamento como concluído?')) return

    try {
      setLoading(true)
      await axios.put(`/api/agendamentos/${agendamento.id}`, {
        status: 'Concluído'
      })
      onStatusChange()
    } catch (err) {
      setError('Erro ao atualizar agendamento')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Função para mudar status
  const handleMudarStatus = async (novoStatus) => {
    try {
      setLoading(true)
      console.log(`[DEBUG] Mudando status do agendamento ${agendamento.id} para: ${novoStatus}`)
      const response = await axios.put(`/api/agendamentos/${agendamento.id}`, {
        status: novoStatus
      })
      console.log(`[DEBUG] Resposta da API:`, response.data)
      setShowStatusMenu(false)
      onStatusChange()
    } catch (err) {
      console.error('[ERRO] Falha ao atualizar status:', err.response?.data || err.message)
      setError(err.response?.data?.erro || 'Erro ao atualizar status')
    } finally {
      setLoading(false)
    }
  }

  // Função para ver histórico - navega para aba Histórico
  const handleHistorico = () => {
    // Dispara evento customizado para o Dashboard mudar de aba
    window.dispatchEvent(new CustomEvent('navegarPara', {
      detail: { tab: 'historico', petId: agendamento.Pet?.id }
    }))
  }

  const status = getStatusDisplay()
  const valor = parseFloat(agendamento.valor || 0)

  return (
    <>
      {showDetalhes && (
        <MobileAgendamentoDetalhes
          agendamentoId={agendamento.id}
          onClose={() => setShowDetalhes(false)}
          onSuccess={() => {
            setShowDetalhes(false)
            onStatusChange()
          }}
        />
      )}

      <div className={`mobile-agendamento-card ${status.classe}`}>
        {error && (
          <div className="card-error">
            {error}
            <button onClick={() => setError('')}>×</button>
          </div>
        )}

        {/* Modal de mudança de status */}
        {showStatusMenu && (
          <div className="status-menu-overlay" onClick={() => setShowStatusMenu(false)}>
            <div className="status-menu" onClick={e => e.stopPropagation()}>
              <button
                className="status-option status-pendente"
                onClick={() => handleMudarStatus('Pendente')}
                disabled={loading}
              >
                ⏳ PENDENTE
              </button>
              <button
                className="status-option status-concluido"
                onClick={() => handleMudarStatus('Concluído')}
                disabled={loading}
              >
                ✓ CONCLUÍDO
              </button>
              <button
                className="status-option status-cancelado"
                onClick={() => handleMudarStatus('Cancelado')}
                disabled={loading}
              >
                ✗ CANCELADO
              </button>
              <button
                className="status-option status-reagendado"
                onClick={() => handleMudarStatus('Reagendado')}
                disabled={loading}
              >
                📅 REAGENDADO
              </button>
            </div>
          </div>
        )}

        {/* Linha 1: Horário + Botões */}
        <div className="card-top">
          <div className="card-horario">
            {mostrarData && agendamento.data && (
              <span className="data-texto">
                {(() => {
                  const raw = agendamento.data
                  // Extrair YYYY-MM-DD independente do formato (ISO, string, etc.)
                  const str = typeof raw === 'string' ? raw : new Date(raw).toISOString()
                  const [y, m, d] = str.substring(0, 10).split('-').map(Number)
                  return new Date(y, m - 1, d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
                })()}
              </span>
            )}
            <span className="horario-texto">{agendamento.hora || agendamento.horario || '--:--'}</span>
          </div>
          <div className="card-acoes">
            <button
              className={`card-status-btn ${status.classe}`}
              onClick={() => setShowStatusMenu(!showStatusMenu)}
              disabled={loading}
              title="Mudar status"
            >
              {status.label}
            </button>
            <button
              className="card-detalhes-btn"
              onClick={() => setShowDetalhes(true)}
              disabled={loading}
            >
              Detalhes
            </button>
          </div>
        </div>

        {/* Linha 2: Cliente | Animal */}
        <div className="card-row">
          <span className="card-cliente">{agendamento.Cliente?.nome || 'Cliente'}</span>
          <span className="card-animal">{getPetEmoji()} {agendamento.Pet?.nome || 'Pet'}</span>
        </div>

        {/* Linha 3: Hora | Valor */}
        <div className="card-row">
          <span className="card-tipo">{agendamento.tipoAtendimento || 'Consulta'}</span>
          <span className="card-valor-txt">
            R$ {valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>
    </>
  )
}
