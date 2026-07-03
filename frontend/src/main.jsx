import React from 'react'
import ReactDOM from 'react-dom/client'
import axios from 'axios'
import App from './App.jsx'
import { API_BASE_URL } from './utils/apiConfig'
import './index.css'

// Usar SEMPRE URLs relativas. Em todos os ambientes:
// - Dev (localhost ou IP da rede): Vite proxy resolve /api → backend
// - Ngrok: faz proxy de tudo para o Vite
// - Produção: backend serve frontend no mesmo origin
// Não setar baseURL = axios usa o origin atual automaticamente.
console.log('[Axios] Usando URLs relativas. Origin:', window.location.origin)

// Adicionar header anti-cache em todas as requisições GET
// (evita problemas de cache em PWA + API)
axios.defaults.headers.common['Cache-Control'] = 'no-cache'
axios.defaults.headers.common['Pragma'] = 'no-cache'

// Interceptor: anexar token JWT a todas as requests (se houver)
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers = config.headers || {}
    if (!config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

// Interceptor: tratar 401 redirecionando para login
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const onLogin = window.location.pathname === '/login'
      if (!onLogin) {
        localStorage.removeItem('token')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
