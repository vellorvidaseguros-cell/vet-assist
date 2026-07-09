import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import CompartilhamentoAceitar from './pages/CompartilhamentoAceitar'
import { registerServiceWorker } from './utils/serviceWorkerUtils'
import './App.css'

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'))

  useEffect(() => {
    // Registrar Service Worker (NÃO pedir permissão automaticamente!
    // No iOS, requestPermission sem user gesture marca como denied para sempre.
    // O LembretesListener pede permissão SOMENTE quando o usuário toca no botão.)
    if (isAuthenticated) {
      registerServiceWorker()
    }
  }, [isAuthenticated])

  const handleLogin = (token, veterinario) => {
    localStorage.setItem('token', token)
    if (veterinario) {
      localStorage.setItem('conta', JSON.stringify(veterinario))
    }
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('conta')
    localStorage.removeItem('activeTab') // próximo login começa na home
    // Limpa cache da agenda para a próxima conta não ver dados de outra
    localStorage.removeItem('cache_agendamentos')
    localStorage.removeItem('cache_faturamentos')
    // Se estava em modo "Ver como" (admin), limpa o backup também
    localStorage.removeItem('admin_token_backup')
    localStorage.removeItem('admin_conta_backup')
    setIsAuthenticated(false)
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/" replace /> : <Login onLogin={handleLogin} />}
        />
        <Route
          path="/compartilhamento/:token"
          element={<CompartilhamentoAceitar />}
        />
        <Route
          path="/"
          element={isAuthenticated ? <Dashboard onLogout={handleLogout} /> : <Navigate to="/login" replace />}
        />
        {/* Fallback: rotas desconhecidas redirecionam */}
        <Route
          path="*"
          element={<Navigate to={isAuthenticated ? "/" : "/login"} replace />}
        />
      </Routes>
    </BrowserRouter>
  )
}
