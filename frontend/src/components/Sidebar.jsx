import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { temRecurso, isAdmin } from '../utils/conta'
import { LayoutDashboard, Users, Calendar, FileText, User, Wallet, GraduationCap, ShoppingCart, MessageCircle, Key } from 'lucide-react'
import './Sidebar.css'

export default function Sidebar({ activeTab, setActiveTab, onLogout, feedbacksNovos = 0 }) {
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
        <NavItem tab="dashboard" recurso="agenda"><LayoutDashboard size={18} /> Dashboard</NavItem>
        <NavItem tab="clientes" recurso="clientes"><Users size={18} /> Clientes</NavItem>
        <NavItem tab="agendamentos" recurso="agenda"><Calendar size={18} /> Agendamentos</NavItem>
        <NavItem tab="historico" recurso="agenda"><FileText size={18} /> Histórico</NavItem>

        <div className="sidebar-divider"></div>

        <NavItem tab="perfil"><User size={18} /> Perfil</NavItem>
        <NavItem tab="financeiro" recurso="cobrancas"><Wallet size={18} /> Financeiro</NavItem>

        {temRecurso('extras') && <div className="sidebar-divider"></div>}

        <NavItem tab="cursos" recurso="extras"><GraduationCap size={18} /> Cursos</NavItem>
        <NavItem tab="marketplace" recurso="extras"><ShoppingCart size={18} /> Marketplace</NavItem>
        <NavItem tab="comunidades" recurso="extras"><MessageCircle size={18} /> Comunidades</NavItem>

        {isAdmin() && (
          <>
            <div className="sidebar-divider"></div>
            <button
              className={`nav-item ${activeTab === 'admin' ? 'active' : ''}`}
              onClick={() => handleNavClick('admin')}
            >
              <Key size={18} /> Administração
              {feedbacksNovos > 0 && (
                <span style={{
                  background: '#dc3545', color: '#fff', borderRadius: '999px',
                  fontSize: '11px', fontWeight: 700, lineHeight: 1,
                  padding: '2px 6px', marginLeft: '8px'
                }}>{feedbacksNovos > 9 ? '9+' : feedbacksNovos}</span>
              )}
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
