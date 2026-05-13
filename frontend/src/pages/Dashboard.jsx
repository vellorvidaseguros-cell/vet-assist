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
import './Dashboard.css'

export default function Dashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    // Recarregar dados quando um histórico é deletado
    const handleHistoricoDeleted = () => {
      setRefreshKey(prev => prev + 1)
    }
    window.addEventListener('historicoDeleted', handleHistoricoDeleted)
    return () => window.removeEventListener('historicoDeleted', handleHistoricoDeleted)
  }, [])

  const handleTabChange = (tab) => {
    setActiveTab(tab)
  }

  const renderContent = () => {
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
