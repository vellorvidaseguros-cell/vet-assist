import { useState, useEffect } from 'react'
import axios from 'axios'
import './MobileClientesList.css'
import NovoClienteModal from './NovoClienteModal'
import MobileClienteDetalhes from './MobileClienteDetalhes'

export default function MobileClientesList() {
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [showNovoClienteModal, setShowNovoClienteModal] = useState(false)
  const [selectedClienteId, setSelectedClienteId] = useState(null)

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

  const handleClienteClick = (clienteId) => {
    setSelectedClienteId(clienteId)
  }

  if (loading) {
    return <div className="mobile-clientes-loading">Carregando...</div>
  }

  return (
    <div className="mobile-clientes-container">
      {showNovoClienteModal && (
        <NovoClienteModal
          onClose={() => setShowNovoClienteModal(false)}
          onSuccess={fetchClientes}
        />
      )}

      {selectedClienteId && (
        <MobileClienteDetalhes
          clienteId={selectedClienteId}
          onClose={() => setSelectedClienteId(null)}
        />
      )}

      {error && (
        <div className="mobile-error">
          {error}
          <button onClick={() => setError('')}>×</button>
        </div>
      )}

      {/* Header */}
      <div className="mobile-clientes-header">
        <h2>👤 Clientes</h2>
        <button className="mobile-btn-novo-cliente" onClick={() => setShowNovoClienteModal(true)}>
          + Novo
        </button>
      </div>

      {/* Barra de busca */}
      <div className="mobile-busca-container">
        <input
          type="text"
          className="mobile-busca-input"
          placeholder="🔍  Buscar cliente..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Lista no estilo histórico */}
      <div className="mobile-clientes-lista">
        <div className="mobile-clientes-lista-header">
          <span>Nome</span>
          <span>Telefone</span>
          <span>Animais</span>
        </div>

        {clientesFiltrados.length === 0 ? (
          <p style={{ padding: '20px', textAlign: 'center', color: '#8e8e93', fontSize: '13px' }}>
            {clientes.length === 0 ? 'Nenhum cliente cadastrado' : 'Nenhum cliente encontrado'}
          </p>
        ) : (
          clientesFiltrados.map(cliente => (
            <div
              key={cliente.id}
              className="mobile-cliente-row-item"
              onClick={() => handleClienteClick(cliente.id)}
            >
              <span className="mcri-nome">👤 {cliente.nome}</span>
              <span className="mcri-tel">{cliente.telefone || '—'}</span>
              <span className="mcri-count">{cliente.Pets?.length || 0}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
