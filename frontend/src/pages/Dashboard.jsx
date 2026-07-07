import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import DashboardHome from '../components/DashboardHome'
import ClientesList from '../components/ClientesList'
import AgendamentosList from '../components/AgendamentosList'
import AnimalHistory from '../components/AnimalHistory'
import Perfil from '../components/Perfil'
import Financeiro from '../components/Financeiro'
import Lixeira from '../components/Lixeira'
import Cursos from '../components/Cursos'
import Marketplace from '../components/Marketplace'
import Comunidades from '../components/Comunidades'
import MobileHome from '../components/MobileHome'
import MobileClientesList from '../components/MobileClientesList'
import MobileCobrancas from '../components/MobileCobrancas'
import MobileAgendamentosList from '../components/MobileAgendamentosList'
import LembretesListener from '../components/LembretesListener'
import AdminPanel from '../components/AdminPanel'
import { temRecurso, isAdmin, atualizarConta } from '../utils/conta'
import './Dashboard.css'

export default function Dashboard({ onLogout }) {
  // A agenda é a home; contas sem esse recurso começam em Clientes.
  // Persiste a aba escolhida — no iOS/PWA o Safari recarrega a página ao voltar
  // do background; sem isso o vet cairia sempre no Dashboard e perderia o contexto.
  const [activeTab, setActiveTab] = useState(() => {
    const salva = localStorage.getItem('activeTab')
    if (salva) return salva
    return temRecurso('agenda') ? 'dashboard' : 'clientes'
  })
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
    // Sincroniza permissões com o servidor (mudança de plano vale sem novo login)
    atualizarConta().then(() => setRefreshKey(prev => prev + 1))
  }, [])

  useEffect(() => {
    // Recarregar dados quando um histórico é deletado
    const handleHistoricoDeleted = () => {
      setRefreshKey(prev => prev + 1)
    }

    // Recarregar dados quando um pagamento é registrado
    const handlePagamentoRegistrado = () => {
      setRefreshKey(prev => prev + 1)
    }

    // Navegar para uma aba específica (usado pelo MobileHome)
    const handleNavegar = (e) => {
      const detail = e.detail
      // Suporta tanto string ("financeiro") quanto objeto ({ tab: "historico", petId: X })
      if (typeof detail === 'string') {
        handleTabChange(detail)
      } else if (detail && detail.tab) {
        handleTabChange(detail.tab)
      }
    }

    window.addEventListener('historicoDeleted', handleHistoricoDeleted)
    window.addEventListener('pagamentoRegistrado', handlePagamentoRegistrado)
    window.addEventListener('navegarPara', handleNavegar)

    return () => {
      window.removeEventListener('historicoDeleted', handleHistoricoDeleted)
      window.removeEventListener('pagamentoRegistrado', handlePagamentoRegistrado)
      window.removeEventListener('navegarPara', handleNavegar)
    }
  }, [])

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    // Lembra a aba para sobreviver a recargas do PWA (iOS descarta a página em background)
    try { localStorage.setItem('activeTab', tab) } catch (e) { /* ignora quota */ }
  }

  const renderContent = () => {
    return (
      <>
        <LembretesListener />
        {isMobile ? renderMobileContent() : renderDesktopContent()}
      </>
    )
  }

  // Recurso exigido para cada aba (null = sempre disponível)
  const RECURSO_DA_ABA = {
    dashboard: 'agenda',
    agendamentos: 'agenda',
    historico: 'agenda',
    clientes: 'clientes',
    financeiro: 'cobrancas',
    cursos: 'extras',
    marketplace: 'extras',
    comunidades: 'extras',
    perfil: null,
    lixeira: null,
    admin: null, // validado por isAdmin()
  }

  const abaLiberada = (tab) => {
    if (tab === 'admin') return isAdmin()
    const recurso = RECURSO_DA_ABA[tab]
    return !recurso || temRecurso(recurso)
  }

  const renderBloqueado = () => (
    <div style={{ padding: '40px 20px', textAlign: 'center', color: '#8e8e93' }}>
      <p style={{ fontSize: '32px', margin: '0 0 8px' }}>🔒</p>
      <p><strong>Recurso não incluído no seu plano.</strong></p>
      <p>Fale com o administrador para fazer upgrade.</p>
    </div>
  )

  const renderMobileContent = () => {
    if (!abaLiberada(activeTab)) return renderBloqueado()
    switch (activeTab) {
      case 'dashboard':
        return <MobileHome key={refreshKey} />
      case 'clientes':
        return <MobileClientesList />
      case 'agendamentos':
        return <MobileAgendamentosList />
      case 'historico':
        return <AnimalHistory />
      case 'perfil':
        return <Perfil />
      case 'financeiro':
        return <MobileCobrancas key={refreshKey} />
      case 'lixeira':
        return <Lixeira />
      case 'cursos':
        return <Cursos />
      case 'marketplace':
        return <Marketplace />
      case 'comunidades':
        return <Comunidades />
      case 'admin':
        return <AdminPanel />
      default:
        return <MobileHome key={refreshKey} />
    }
  }

  const renderDesktopContent = () => {
    if (!abaLiberada(activeTab)) return renderBloqueado()
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
      case 'lixeira':
        return <Lixeira />
      case 'cursos':
        return <Cursos />
      case 'marketplace':
        return <Marketplace />
      case 'comunidades':
        return <Comunidades />
      case 'admin':
        return <AdminPanel />
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
      comunidades: 'Comunidades',
      lixeira: 'Lixeira',
      admin: 'Administração'
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
          {abaLiberada('dashboard') && (
            <button
              className={`nav-item ${activeTab === 'dashboard' ? 'ativo' : ''}`}
              onClick={() => handleTabChange('dashboard')}
              title="Agenda"
            >
              <span className="nav-icon">📅</span>
              <span className="nav-label">Agenda</span>
            </button>
          )}
          {abaLiberada('clientes') && (
            <button
              className={`nav-item ${activeTab === 'clientes' ? 'ativo' : ''}`}
              onClick={() => handleTabChange('clientes')}
              title="Clientes"
            >
              <span className="nav-icon">👥</span>
              <span className="nav-label">Clientes</span>
            </button>
          )}
          {abaLiberada('financeiro') && (
            <button
              className={`nav-item ${activeTab === 'financeiro' ? 'ativo' : ''}`}
              onClick={() => handleTabChange('financeiro')}
              title="Cobranças"
            >
              <span className="nav-icon">💰</span>
              <span className="nav-label">Cobranças</span>
            </button>
          )}
          {isAdmin() && (
            <button
              className={`nav-item ${activeTab === 'admin' ? 'ativo' : ''}`}
              onClick={() => handleTabChange('admin')}
              title="Administração"
            >
              <span className="nav-icon">🔑</span>
              <span className="nav-label">Admin</span>
            </button>
          )}
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
