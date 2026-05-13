// Configuração automática da URL do backend
// Funciona com localhost, IP externo, ngrok e produção (Railway)

const getBackendURL = () => {
  const { hostname, origin, protocol } = window.location

  // Localhost / desenvolvimento
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:5000'
  }

  // Ngrok (tunelamento) - usa o mesmo host com HTTPS, sem porta
  if (hostname.includes('ngrok')) {
    return `https://${hostname}`
  }

  // IP local (rede interna)
  if (hostname.startsWith('192.168') || hostname.startsWith('10.') || hostname.startsWith('172.')) {
    return `${protocol}//${hostname}:5000`
  }

  // Produção (Railway, Vercel, etc.) - backend serve o frontend no mesmo origin
  return origin
}

export const API_BASE_URL = getBackendURL()

// Função helper para construir URLs
export const apiUrl = (endpoint) => `${API_BASE_URL}${endpoint}`

console.log('[API Config] Backend URL:', API_BASE_URL)
