import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { temRecurso, isAdmin } from '../utils/conta'
import './Sidebar.css'

export default function Sidebar({ activeTab, setActiveTab, onLogout }) {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => {
    onLogout()
    navigate('/login')
  }

  const handleNavClick = (tab) => {
    setActiveTab(tab)
    setMenuOpen(false) // Fechar menu após clicar
  }

  // Item de navegação condicionado ao recurso do plano
  const NavItem = ({ tab, recurso, children }) => {
    if (recurso && !temRecurso(recurso)) return null
    return (
      <button
        className={`nav-item ${activeTab === tab ? 'active' : ''}`}
        onClick={() => handleNavClick(tab)}
      >
        {children}
      </button>
    )
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>VetAssist</h2>
      </div>

      <button
        className={`hamburger ${menuOpen ? 'open' : ''}`}
        onClick={() => setMenuOpen(!menuOpen)}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      <nav className={`sidebar-nav ${menuOpen ? 'open' : ''}`}>
        <NavItem tab="dashboard" recurso="agenda">📊 Dashboard</NavItem>
        <NavItem tab="clientes" recurso="clientes">👥 Clientes</NavItem>
        <NavItem tab="agendamentos" recurso="agenda">📅 Agendamentos</NavItem>
        <NavItem tab="historico" recurso="agenda">📋 Histórico</NavItem>

        <div className="sidebar-divider"></div>

        <NavItem tab="perfil">👤 Perfil</NavItem>
        <NavItem tab="financeiro" recurso="cobrancas">💰 Financeiro</NavItem>

        {temRecurso('extras') && <div className="sidebar-divider"></div>}

        <NavItem tab="cursos" recurso="extras">📚 Cursos</NavItem>
        <NavItem tab="marketplace" recurso="extras">🛒 Marketplace</NavItem>
        <NavItem tab="comunidades" recurso="extras">💬 Comunidades</NavItem>

        {isAdmin() && (
          <>
            <div className="sidebar-divider"></div>
            <button
              className={`nav-item ${activeTab === 'admin' ? 'active' : ''}`}
              onClick={() => handleNavClick('admin')}
            >
              🔑 Administração
            </button>
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <button className="logout-btn" onClick={handleLogout}>
          Sair
        </button>
      </div>
    </aside>
  )
}
