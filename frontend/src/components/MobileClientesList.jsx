import { useState, useEffect } from 'react'
import axios from 'axios'
import './MobileClientesList.css'

export default function MobileClientesList() {
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchClientes()
  }, [])

  const fetchClientes = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/clientes')
      if (response.data.sucesso) {
        setClientes(response.data.data || [])
      }
    } catch (err) {
      setError('Erro ao carregar clientes')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const clientesFiltrados = clientes.filter(cliente =>
    (cliente.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cliente.telefone || '').includes(searchTerm)
  )

  if (loading) {
    return <div className="mobile-clientes-loading">Carregando...</div>
  }

  return (
    <div className="mobile-clientes-container">
      {error && (
        <div className="mobile-error">
          {error}
          <button onClick={() => setError('')}>×</button>
        </div>
      )}

      {/* Barra de busca */}
      <div className="mobile-clientes-search">
        <input
          type="text"
          placeholder="Buscar cliente..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mobile-clientes-input"
        />
        {searchTerm && (
          <button
            className="mobile-clientes-clear"
            onClick={() => setSearchTerm('')}
          >
            ×
          </button>
        )}
      </div>

      {/* Lista de clientes */}
      {clientesFiltrados.length === 0 ? (
        <div className="mobile-clientes-empty">
          {clientes.length === 0
            ? 'Nenhum cliente cadastrado'
            : 'Nenhum cliente encontrado'}
        </div>
      ) : (
        <div className="mobile-clientes-list">
          {clientesFiltrados.map(cliente => (
            <div key={cliente.id} className="mobile-cliente-item">
              <div className="cliente-avatar">
                {cliente.nome.charAt(0).toUpperCase()}
              </div>

              <div className="cliente-info">
                <div className="cliente-nome">{cliente.nome}</div>
                {cliente.telefone && (
                  <div className="cliente-telefone">📱 {cliente.telefone}</div>
                )}
                {cliente.Pets && cliente.Pets.length > 0 && (
                  <div className="cliente-pets">
                    🐾 {cliente.Pets.length} animal{cliente.Pets.length !== 1 ? 's' : ''}
                  </div>
                )}
              </div>

              <div className="cliente-arrow">›</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
