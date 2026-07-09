import { useState, useEffect } from 'react'
import axios from 'axios'
import './SolicitacoesSenhaList.css'

export default function SolicitacoesSenhaList() {
  const [lista, setLista] = useState([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [tokenGerado, setTokenGerado] = useState({}) // { [id]: { codigo, nome, email, telefone } }

  useEffect(() => {
    carregar()
  }, [])

  const carregar = async () => {
    try {
      setLoading(true)
      const res = await axios.get('/api/admin/solicitacoes-senha')
      if (res.data.sucesso) setLista(res.data.data || [])
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao carregar pedidos')
    } finally {
      setLoading(false)
    }
  }

  const gerarToken = async (item) => {
    try {
      const res = await axios.post(`/api/admin/solicitacoes-senha/${item.id}/gerar-token`)
      if (res.data.sucesso) {
        setTokenGerado(prev => ({ ...prev, [item.id]: res.data.data }))
        setLista(prev => prev.map(s => s.id === item.id ? { ...s, status: 'token_gerado' } : s))
      }
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao gerar token')
    }
  }

  const linkWhatsApp = (telefone, codigo) => {
    const numero = (telefone || '').replace(/\D/g, '')
    const alvo = numero ? (numero.startsWith('55') ? numero : `55${numero}`) : ''
    const texto = encodeURIComponent(`Seu código de recuperação de senha no VetAssist é: ${codigo}\n\nVálido por 15 minutos. Não compartilhe com ninguém.`)
    return alvo ? `https://wa.me/${alvo}?text=${texto}` : `https://wa.me/?text=${texto}`
  }

  if (loading) return <div className="admin-loading">Carregando...</div>

  return (
    <div className="ss-lista">
      {erro && <div className="admin-erro">{erro} <button onClick={() => setErro('')}>×</button></div>}

      {lista.length === 0 ? (
        <div className="ss-vazio">Nenhum pedido de redefinição de senha pendente.</div>
      ) : (
        lista.map(item => {
          const token = tokenGerado[item.id]
          return (
            <div key={item.id} className="ss-card">
              <div className="ss-topo">
                <strong>{item.nome}</strong>
                <span className="ss-data">{new Date(item.createdAt).toLocaleDateString('pt-BR')} às {new Date(item.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="ss-email">{item.email}{item.telefone ? ` • ${item.telefone}` : ' • sem telefone cadastrado'}</div>

              {!token ? (
                <button type="button" className="ss-btn-gerar" onClick={() => gerarToken(item)}>
                  Gerar Token
                </button>
              ) : (
                <div className="ss-token-box">
                  <div className="ss-token-valor">Código: <strong>{token.codigo}</strong> <span className="ss-token-validade">(válido 15 min)</span></div>
                  <a
                    className="ss-btn-whatsapp"
                    href={linkWhatsApp(token.telefone, token.codigo)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Enviar por WhatsApp
                  </a>
                </div>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}
