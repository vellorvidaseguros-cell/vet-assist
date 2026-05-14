import { useState } from 'react'
import './FAB.css'

export default function FAB({
  onMenuToggle,
  showMenu,
  onNovoAgendamento,
  onNovoCliente,
  onNovaCobranca
}) {
  const handleToggleMenu = () => {
    onMenuToggle(!showMenu)
  }

  const handleAgendamento = () => {
    if (onNovoAgendamento) {
      onNovoAgendamento()
    }
  }

  const handleNovoCliente = () => {
    if (onNovoCliente) {
      onNovoCliente()
    }
  }

  const handleNovaCobranca = () => {
    if (onNovaCobranca) {
      onNovaCobranca()
    }
  }

  return (
    <div className="fab-container">
      {/* Menu flutuante (aparece quando FAB está expandido) */}
      {showMenu && (
        <div className="fab-menu">
          <button
            className="fab-menu-item fab-agendamento"
            onClick={handleAgendamento}
            title="Novo Agendamento"
          >
            <span className="fab-menu-icon">📅</span>
            <span className="fab-menu-label">Agendamento</span>
          </button>

          <button
            className="fab-menu-item fab-cliente"
            onClick={handleNovoCliente}
            title="Novo Cliente"
          >
            <span className="fab-menu-icon">👤</span>
            <span className="fab-menu-label">Novo Cliente</span>
          </button>

          <button
            className="fab-menu-item fab-cobranca"
            onClick={handleNovaCobranca}
            title="Nova Cobrança"
          >
            <span className="fab-menu-icon">💰</span>
            <span className="fab-menu-label">Cobrança</span>
          </button>
        </div>
      )}

      {/* Botão FAB Principal */}
      <button
        className={`fab-button ${showMenu ? 'ativo' : ''}`}
        onClick={handleToggleMenu}
        title="Adicionar"
      >
        <span className="fab-icon">➕</span>
      </button>

      {/* Overlay para fechar o menu ao clicar fora */}
      {showMenu && (
        <div className="fab-overlay" onClick={() => onMenuToggle(false)} />
      )}
    </div>
  )
}
