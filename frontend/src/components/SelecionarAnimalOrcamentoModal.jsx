import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import axios from 'axios'
import { useSwipeToClose } from '../hooks/useSwipeToClose'
import './SelecionarAnimalOrcamentoModal.css'

// Atalho rápido do FAB: escolhe cliente → animal antes de abrir o Orçamento,
// já que o QuoteModal precisa desses dois objetos.
export default function SelecionarAnimalOrcamentoModal({ onClose, onSelecionar }) {
  const { ref: swipeRef, style: swipeStyle } = useSwipeToClose(onClose)
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busca, setBusca] = useState('')
  const [clienteSelecionado, setClienteSelecionado] = useState(null)

  useEffect(() => {
    buscarClientes()
  }, [])

  const buscarClientes = async () => {
    try {
      setLoading(true)
      const res = await axios.get('/api/clientes')
      if (res.data.sucesso) {
        setClientes(res.data.data || [])
      }
    } catch (err) {
      setError('Erro ao carregar clientes')
    } finally {
      setLoading(false)
    }
  }

  const clientesFiltrados = clientes.filter(c =>
    (c.nome || '').toLowerCase().includes(busca.toLowerCase())
  )

  const handleEscolherAnimal = (pet) => {
    onSelecionar(clienteSelecionado, pet)
  }

  return createPortal(
    <div className="sao-overlay" onClick={onClose}>
      <div className="sao-modal" ref={swipeRef} style={swipeStyle} onClick={(e) => e.stopPropagation()}>
        <div className="sao-header">
          <h2>Novo Orçamento</h2>
          <button className="sao-btn-close" onClick={onClose}>✕</button>
        </div>

        {error && <div className="sao-error">{error}</div>}

        {!clienteSelecionado ? (
          <>
            <div className="sao-busca">
              <input
                type="text"
                placeholder="Buscar cliente..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                autoFocus
              />
            </div>

            <div className="sao-lista">
              {loading ? (
                <p className="sao-vazio">Carregando...</p>
              ) : clientesFiltrados.length === 0 ? (
                <p className="sao-vazio">Nenhum cliente encontrado</p>
              ) : (
                clientesFiltrados.map(cliente => (
                  <button
                    key={cliente.id}
                    type="button"
                    className="sao-item"
                    onClick={() => setClienteSelecionado(cliente)}
                    disabled={!cliente.Pets || cliente.Pets.length === 0}
                  >
                    <span className="sao-item-nome">{cliente.nome}</span>
                    <span className="sao-item-info">
                      {cliente.Pets?.length ? `${cliente.Pets.length} animal(is)` : 'sem animais'}
                    </span>
                  </button>
                ))
              )}
            </div>
          </>
        ) : (
          <>
            <div className="sao-voltar">
              <button type="button" onClick={() => setClienteSelecionado(null)}>← Trocar cliente</button>
              <span className="sao-cliente-nome">{clienteSelecionado.nome}</span>
            </div>

            <p className="sao-subtitulo">Selecione o animal:</p>
            <div className="sao-lista">
              {(clienteSelecionado.Pets || []).map(pet => (
                <button
                  key={pet.id}
                  type="button"
                  className="sao-item"
                  onClick={() => handleEscolherAnimal(pet)}
                >
                  <span className="sao-item-nome">{pet.nome}</span>
                  <span className="sao-item-info">{pet.especie}{pet.raca ? ` • ${pet.raca}` : ''}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  )
}
