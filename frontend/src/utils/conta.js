import axios from 'axios'

// Dados da conta logada (gravados no login; atualizados via /api/veterinarios/me)

export function getConta() {
  try {
    const raw = localStorage.getItem('conta')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function isAdmin() {
  return getConta()?.role === 'admin'
}

export function temRecurso(chave) {
  const conta = getConta()
  if (!conta) return true // sem info (login antigo): não esconder nada; o backend barra
  if (conta.role === 'admin') return true
  return Array.isArray(conta.permissoes) && conta.permissoes.includes(chave)
}

// Recarrega permissões do servidor (mudanças de plano valem sem novo login)
export async function atualizarConta() {
  try {
    const res = await axios.get('/api/veterinarios/me')
    if (res.data.sucesso && res.data.data) {
      localStorage.setItem('conta', JSON.stringify(res.data.data))
      return res.data.data
    }
  } catch {
    // silencioso: mantém o que está no localStorage
  }
  return getConta()
}
