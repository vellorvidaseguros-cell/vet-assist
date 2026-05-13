import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
        <button
          className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => handleNavClick('dashboard')}
        >
          📊 Dashboard
        </button>
        <button
          className={`nav-item ${activeTab === 'clientes' ? 'active' : ''}`}
          onClick={() => handleNavClick('clientes')}
        >
          👥 Clientes
        </button>
        <button
          className={`nav-item ${activeTab === 'agendamentos' ? 'active' : ''}`}
          onClick={() => handleNavClick('agendamentos')}
        >
          📅 Agendamentos
        </button>
        <button
          className={`nav-item ${activeTab === 'historico' ? 'active' : ''}`}
          onClick={() => handleNavClick('historico')}
        >
          📋 Histórico
        </button>

        <div className="sidebar-divider"></div>

        <button
          className={`nav-item ${activeTab === 'perfil' ? 'active' : ''}`}
          onClick={() => handleNavClick('perfil')}
        >
          👤 Perfil
        </button>
        <button
          className={`nav-item ${activeTab === 'financeiro' ? 'active' : ''}`}
          onClick={() => handleNavClick('financeiro')}
        >
          💰 Financeiro
        </button>

        <div className="sidebar-divider"></div>

        <button
          className={`nav-item ${activeTab === 'cursos' ? 'active' : ''}`}
          onClick={() => handleNavClick('cursos')}
        >
          📚 Cursos
        </button>
        <button
          className={`nav-item ${activeTab === 'marketplace' ? 'active' : ''}`}
          onClick={() => handleNavClick('marketplace')}
        >
          🛒 Marketplace
        </button>
        <button
          className={`nav-item ${activeTab === 'comunidades' ? 'active' : ''}`}
          onClick={() => handleNavClick('comunidades')}
        >
          💬 Comunidades
        </button>
      </nav>

      <div className="sidebar-footer">
        <button className="logout-btn" onClick={handleLogout}>
          Sair
        </button>
      </div>
    </aside>
  )
}
