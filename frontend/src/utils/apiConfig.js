// Configuração do backend
//
// Estratégia: SEMPRE usar URLs relativas (ex: '/api/agendamentos')
// - Em dev (localhost ou IP de rede): o Vite faz proxy do /api → backend
// - Em ngrok: o ngrok faz proxy de tudo para o Vite
// - Em produção (Railway): backend serve frontend no mesmo origin
//
// Isso elimina problemas de hardcoded URLs e portas erradas.

export const API_BASE_URL = ''  // vazio = sempre relativo ao origin atual

// Função helper - retorna apenas o endpoint, deixando axios resolver baseURL
export const apiUrl = (endpoint) => endpoint

console.log('[API Config] Usando URLs relativas (origin:', window.location.origin, ')')
