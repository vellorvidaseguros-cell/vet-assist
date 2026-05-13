import React from 'react'
import ReactDOM from 'react-dom/client'
import axios from 'axios'
import App from './App.jsx'
import { API_BASE_URL } from './utils/apiConfig'
import './index.css'

// Em produção (Railway), o frontend é servido pelo mesmo origin do backend,
// então paths relativos como "/api/..." funcionam sem baseURL.
// Em dev (localhost:5173 com proxy Vite), também funciona.
// Em outros casos (IPs, ngrok), forçamos a baseURL para garantir.
const isLocalDevWithProxy =
  window.location.hostname === 'localhost' &&
  window.location.port === '5173'

const isProductionSameOrigin = API_BASE_URL === window.location.origin

if (!isLocalDevWithProxy && !isProductionSameOrigin) {
  axios.defaults.baseURL = API_BASE_URL
  console.log('[Axios] baseURL configurada:', API_BASE_URL)
}

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
