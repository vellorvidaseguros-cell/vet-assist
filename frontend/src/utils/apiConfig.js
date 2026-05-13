// Configuração automática da URL do backend
// Funciona com localhost ou IP externo

const getBackendURL = () => {
  // Se estiver em localhost, usa localhost:5000
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:5000'
  }

  // Se estiver em ngrok (domínio .ngrok-free.dev ou .ngrok.dev), usa https
  if (window.location.hostname.includes('ngrok')) {
    return `https://${window.location.hostname}:5000`
  }

  // Se estiver em IP externo (ex: 192.168.15.27), usa o mesmo IP
  if (window.location.hostname.includes('192.168')) {
    return `http://${window.location.hostname}:5000`
  }

  // Fallback para o hostname atual (em caso de outros endereços)
  return `http://${window.location.hostname}:5000`
}

export const API_BASE_URL = getBackendURL()

// Função helper para construir URLs
export const apiUrl = (endpoint) => `${API_BASE_URL}${endpoint}`

console.log('[API Config] Backend URL:', API_BASE_URL)
