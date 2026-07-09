import { useState } from 'react'
import { Calendar, User, DollarSign, ClipboardList, Receipt, Plus } from 'lucide-react'
import './FAB.css'

export default function FAB({
  onMenuToggle,
  showMenu,
  onNovoAgendamento,
  onNovoCliente,
  onNovaCobranca,
  onHistorico,
  onOrcamento
}) {
  const handleToggleMenu = () => {
    onMenuToggle(!showMenu)
  }

  const handleAgendamento = () => {
    if (onNovoAgendamento) onNovoAgendamento()
  }

  const handleNovoCliente = () => {
    if (onNovoCliente) onNovoCliente()
  }

  const handleNovaCobranca = () => {
    if (onNovaCobranca) onNovaCobranca()
  }

  const handleHistorico = () => {
    if (onHistorico) onHistorico()
  }

  const handleOrcamento = () => {
    if (onOrcamento) onOrcamento()
  }

  return (
    <div className="fab-container">
      {/* Overlay para fechar o menu ao clicar fora (renderizado primeiro para ficar atrás dos botões) */}
      {showMenu && (
        <div className="fab-overlay" onClick={() => onMenuToggle(false)} />
      )}

      {/* Menu flutuante (aparece quando FAB está expandido) */}
      {showMenu && (
        <div className="fab-menu">
          <button
            type="button"
            className="fab-menu-item fab-agendamento"
            onClick={(e) => { e.stopPropagation(); handleAgendamento(); }}
            title="Novo Agendamento"
          >
            <span className="fab-menu-icon"><Calendar size={18} /></span>
            <span className="fab-menu-label">Agendamento</span>
          </button>

          <button
            type="button"
            className="fab-menu-item fab-cliente"
            onClick={(e) => { e.stopPropagation(); handleNovoCliente(); }}
            title="Novo Cliente"
          >
            <span className="fab-menu-icon"><User size={18} /></span>
            <span className="fab-menu-label">Novo Cliente</span>
          </button>

          <button
            type="button"
            className="fab-menu-item fab-cobranca"
            onClick={(e) => { e.stopPropagation(); handleNovaCobranca(); }}
            title="Nova Cobrança"
          >
            <span className="fab-menu-icon"><DollarSign size={18} /></span>
            <span className="fab-menu-label">Cobrança</span>
          </button>

          <button
            type="button"
            className="fab-menu-item fab-historico"
            onClick={(e) => { e.stopPropagation(); handleHistorico(); }}
            title="Histórico de Pacientes"
          >
            <span className="fab-menu-icon"><ClipboardList size={18} /></span>
            <span className="fab-menu-label">Histórico</span>
          </button>

          <button
            type="button"
            className="fab-menu-item fab-orcamento"
            onClick={(e) => { e.stopPropagation(); handleOrcamento(); }}
            title="Novo Orçamento"
          >
            <span className="fab-menu-icon"><Receipt size={18} /></span>
            <span className="fab-menu-label">Orçamento</span>
          </button>
        </div>
      )}

      {/* Botão FAB Principal */}
      <button
        type="button"
        className={`fab-button ${showMenu ? 'ativo' : ''}`}
        onClick={handleToggleMenu}
        title="Adicionar"
      >
        <span className="fab-icon"><Plus size={28} strokeWidth={2.5} /></span>
      </button>
    </div>
  )
}
