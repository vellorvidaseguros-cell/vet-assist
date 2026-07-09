import { useState, useEffect } from 'react'
import axios from 'axios'
import './Lixeira.css'

export default function Lixeira() {
  const [itens, setItens] = useState([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [restaurandoId, setRestaurandoId] = useState(null)
  const [sucesso, setSucesso] = useState('')

  useEffect(() => {
    fetchLixeira()
  }, [])

  const fetchLixeira = async () => {
    try {
      setLoading(true)
      const res = await axios.get('/api/lixeira')
      if (res.data.sucesso) setItens(res.data.data || [])
    } catch (err) {
      setErro('Erro ao carregar a lixeira')
    } finally {
      setLoading(false)
    }
  }

  const handleRestaurar = async (item) => {
    const chave = `${item.tipo}-${item.id}`
    setRestaurandoId(chave)
    setErro('')
    setSucesso('')
    try {
      const res = await axios.post(`/api/lixeira/${item.tipo}/${item.id}/restaurar`)
      if (res.data.sucesso) {
        setSucesso(res.data.mensagem || 'Item restaurado!')
        setItens(prev => prev.filter(i => !(i.tipo === item.tipo && i.id === item.id)))
        setTimeout(() => setSucesso(''), 3000)
      }
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao restaurar item')
    } finally {
      setRestaurandoId(null)
    }
  }

  if (loading) return <div className="loading">Carregando lixeira...</div>

  return (
    <div className="lixeira-container">
      <div className="lixeira-header">
        <div className="lixeira-header-top">
          <h2>Lixeira</h2>
          <button
            className="btn-sair-lixeira"
            onClick={() => window.dispatchEvent(new CustomEvent('navegarPara', { detail: 'perfil' }))}
          >
            ← Voltar ao Perfil
          </button>
        </div>
        <p className="lixeira-subtitulo">Itens excluídos podem ser restaurados a qualquer momento.</p>
      </div>

      {erro && <div className="error-message">{erro}</div>}
      {sucesso && <div className="lixeira-sucesso">{sucesso}</div>}

      {itens.length === 0 ? (
        <p className="empty-message">Nenhum item na lixeira.</p>
      ) : (
        <div className="lixeira-lista">
          {itens.map(item => {
            const chave = `${item.tipo}-${item.id}`
            return (
              <div key={chave} className="lixeira-item">
                <div className="lixeira-item-info">
                  <span className="lixeira-tipo-chip">{item.tipoLabel}</span>
                  <span className="lixeira-nome">{item.nome}</span>
                  <span className="lixeira-data">Excluído em {new Date(item.deletedAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <button
                  className="btn-restaurar"
                  onClick={() => handleRestaurar(item)}
                  disabled={restaurandoId === chave}
                >
                  {restaurandoId === chave ? 'Restaurando...' : 'Restaurar'}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
