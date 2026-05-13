import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import DashboardHome from '../components/DashboardHome'
import ClientesList from '../components/ClientesList'
import AgendamentosList from '../components/AgendamentosList'
import AnimalHistory from '../components/AnimalHistory'
import Perfil from '../components/Perfil'
import Financeiro from '../components/Financeiro'
import Cursos from '../components/Cursos'
import Marketplace from '../components/Marketplace'
import Comunidades from '../components/Comunidades'
import MobileHome from '../components/MobileHome'
import MobileClientesList from '../components/MobileClientesList'
import MobileCobrancas from '../components/MobileCobrancas'
import './Dashboard.css'

export default function Dashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [refreshKey, setRefreshKey] = useState(0)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    // Recarregar dados quando um histórico é deletado
    const handleHistoricoDeleted = () => {
      setRefreshKey(prev => prev + 1)
    }

    // Navegar para uma aba específica (usado pelo MobileHome)
    const handleNavegar = (e) => {
      handleTabChange(e.detail)
    }

    window.addEventListener('historicoDeleted', handleHistoricoDeleted)
    window.addEventListener('navegarPara', handleNavegar)

    return () => {
      window.removeEventListener('historicoDeleted', handleHistoricoDeleted)
      window.removeEventListener('navegarPara', handleNavegar)
    }
  }, [])

  const handleTabChange = (tab) => {
    setActiveTab(tab)
  }

  const renderContent = () => {
    // Mobile - mostrar componentes mobile
    if (isMobile) {
      switch (activeTab) {
        case 'dashboard':
          return <MobileHome key={refreshKey} />
        case 'clientes':
          return <MobileClientesList />
        case 'agendamentos':
          return <AgendamentosList />
        case 'historico':
          return <AnimalHistory />
        case 'perfil':
          return <Perfil />
        case 'financeiro':
          return <MobileCobrancas key={refreshKey} />
        case 'cursos':
          return <Cursos />
        case 'marketplace':
          return <Marketplace />
        case 'comunidades':
          return <Comunidades />
        default:
          return <MobileHome key={refreshKey} />
      }
    }

    // Desktop - componentes normais
    switch (activeTab) {
      case 'dashboard':
        return <DashboardHome key={refreshKey} />
      case 'clientes':
        return <ClientesList />
      case 'agendamentos':
        return <AgendamentosList />
      case 'historico':
        return <AnimalHistory />
      case 'perfil':
        return <Perfil />
      case 'financeiro':
        return <Financeiro key={refreshKey} />
      case 'cursos':
        return <Cursos />
      case 'marketplace':
        return <Marketplace />
      case 'comunidades':
        return <Comunidades />
      default:
        return <DashboardHome key={refreshKey} />
    }
  }

  const getTitle = (tab) => {
    const titles = {
      dashboard: 'Dashboard',
      clientes: 'Clientes',
      agendamentos: 'Agendamentos',
      historico: 'Histórico de Consultas',
      perfil: 'Perfil',
      financeiro: 'Financeiro',
      cursos: 'Cursos',
      marketplace: 'Marketplace',
      comunidades: 'Comunidades'
    }
    return titles[tab] || 'Dashboard'
  }

  // Layout Mobile
  if (isMobile) {
    return (
      <div className="dashboard dashboard-mobile">
        <main className="main-content mobile-main">
          {renderContent()}
        </main>
        {/* Bottom Navigation - será implementado na Fase 2 */}
        <nav className="mobile-bottom-nav">
          <button
            className={`nav-item ${activeTab === 'dashboard' ? 'ativo' : ''}`}
            onClick={() => handleTabChange('dashboard')}
            title="Agenda"
          >
            <span className="nav-icon">📅</span>
            <span className="nav-label">Agenda</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'clientes' ? 'ativo' : ''}`}
            onClick={() => handleTabChange('clientes')}
            title="Clientes"
          >
            <span className="nav-icon">👥</span>
            <span className="nav-label">Clientes</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'financeiro' ? 'ativo' : ''}`}
            onClick={() => handleTabChange('financeiro')}
            title="Cobranças"
          >
            <span className="nav-icon">💰</span>
            <span className="nav-label">Cobranças</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'perfil' ? 'ativo' : ''}`}
            onClick={() => handleTabChange('perfil')}
            title="Perfil"
          >
            <span className="nav-icon">👤</span>
            <span className="nav-label">Perfil</span>
          </button>
        </nav>
      </div>
    )
  }

  // Layout Desktop
  return (
    <div className="dashboard">
      <Sidebar activeTab={activeTab} setActiveTab={handleTabChange} onLogout={onLogout} />
      <div className="dashboard-content">
        {activeTab !== 'dashboard' && (
          <header className="dashboard-header">
            <h1>{getTitle(activeTab)}</h1>
          </header>
        )}
        <main className="main-content">
          {renderContent()}
        </main>
      </div>
    </div>
  )
}
