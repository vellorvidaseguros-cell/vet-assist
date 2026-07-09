import { useState, useEffect } from 'react'
import axios from 'axios'
import './FeedbackAdminList.css'

const TIPO_LABEL = { duvida: 'Dúvida', sugestao: 'Sugestão', bug: 'Problema' }
const STATUS_LABEL = { novo: 'Novo', lido: 'Lido', resolvido: 'Resolvido' }

export default function FeedbackAdminList() {
  const [lista, setLista] = useState([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [filtro, setFiltro] = useState('todos')

  useEffect(() => {
    carregar()
  }, [])

  const carregar = async () => {
    try {
      setLoading(true)
      const res = await axios.get('/api/feedback')
      if (res.data.sucesso) setLista(res.data.data || [])
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao carregar feedbacks')
    } finally {
      setLoading(false)
    }
  }

  const mudarStatus = async (item, status) => {
    try {
      await axios.put(`/api/feedback/${item.id}`, { status })
      setLista(prev => prev.map(f => f.id === item.id ? { ...f, status } : f))
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao atualizar status')
    }
  }

  if (loading) return <div className="admin-loading">Carregando...</div>

  const listaFiltrada = filtro === 'todos' ? lista : lista.filter(f => f.status === filtro)
  const totalNovos = lista.filter(f => f.status === 'novo').length

  return (
    <div className="feedback-admin">
      {erro && <div className="admin-erro">{erro} <button onClick={() => setErro('')}>×</button></div>}

      <div className="feedback-admin-filtros">
        {['todos', 'novo', 'lido', 'resolvido'].map(f => (
          <button
            key={f}
            className={`feedback-filtro-chip ${filtro === f ? 'ativo' : ''}`}
            onClick={() => setFiltro(f)}
          >
            {f === 'todos' ? 'Todos' : STATUS_LABEL[f]}
            {f === 'novo' && totalNovos > 0 && <span className="feedback-badge-count">{totalNovos}</span>}
          </button>
        ))}
      </div>

      {listaFiltrada.length === 0 ? (
        <div className="feedback-admin-vazio">Nenhum item por aqui.</div>
      ) : (
        <div className="feedback-admin-lista">
          {listaFiltrada.map(item => (
            <div key={item.id} className={`feedback-admin-card status-${item.status}`}>
              <div className="feedback-admin-topo">
                <span className="feedback-admin-tipo">{TIPO_LABEL[item.tipo] || item.tipo}</span>
                <span className="feedback-admin-data">
                  {new Date(item.createdAt).toLocaleDateString('pt-BR')} às {new Date(item.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="feedback-admin-mensagem">{item.mensagem}</p>
              <div className="feedback-admin-autor">De: <strong>{item.autorNome}</strong> ({item.autorEmail})</div>
              <div className="feedback-admin-acoes">
                {['novo', 'lido', 'resolvido'].map(s => (
                  <button
                    key={s}
                    className={`feedback-status-btn ${item.status === s ? 'ativo' : ''}`}
                    onClick={() => mudarStatus(item, s)}
                  >
                    {STATUS_LABEL[s]}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
