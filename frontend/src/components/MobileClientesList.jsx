import { useState, useEffect } from 'react'
import axios from 'axios'
import { Check, X } from 'lucide-react'
import './MobileClientesList.css'
import NovoClienteModal from './NovoClienteModal'
import MobileClienteDetalhes from './MobileClienteDetalhes'
import AnimalHistoryModal from './AnimalHistoryModal'

export default function MobileClientesList() {
  const [clientes, setClientes] = useState([])
  const [compartilhados, setCompartilhados] = useState([])
  const [convites, setConvites] = useState([])
  const [processandoConvite, setProcessandoConvite] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [showNovoClienteModal, setShowNovoClienteModal] = useState(false)
  const [selectedClienteId, setSelectedClienteId] = useState(null)
  const [animalCompartilhado, setAnimalCompartilhado] = useState(null)

  useEffect(() => {
    fetchClientes()
    fetchCompartilhados()
    fetchConvites()

    // Abre automaticamente o cliente pendente vindo da busca (MobileSearch)
    const pendente = sessionStorage.getItem('abrirClienteId')
    if (pendente) {
      setSelectedClienteId(pendente)
      sessionStorage.removeItem('abrirClienteId')
    }
  }, [])

  const fetchConvites = async () => {
    try {
      const response = await axios.get('/api/compartilhamento/convites-recebidos')
      if (response.data.sucesso) setConvites(response.data.data || [])
    } catch (err) {
      console.error('Erro ao carregar convites', err)
    }
  }

  const handleAceitarConvite = async (id) => {
    setProcessandoConvite(id)
    try {
      await axios.post(`/api/compartilhamento/convites/${id}/aceitar`)
      await Promise.all([fetchConvites(), fetchCompartilhados()])
    } catch (err) {
      setError('Erro ao aceitar convite')
    } finally {
      setProcessandoConvite(null)
    }
  }

  const handleRecusarConvite = async (id) => {
    setProcessandoConvite(id)
    try {
      await axios.post(`/api/compartilhamento/convites/${id}/recusar`)
      await fetchConvites()
    } catch (err) {
      setError('Erro ao recusar convite')
    } finally {
      setProcessandoConvite(null)
    }
  }

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

  const fetchCompartilhados = async () => {
    try {
      const response = await axios.get('/api/compartilhamento/compartilhados-comigo')
      if (response.data.sucesso) {
        setCompartilhados(response.data.data || [])
      }
    } catch (err) {
      console.error('Erro ao carregar animais compartilhados', err)
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

      {animalCompartilhado && (
        <AnimalHistoryModal
          petId={animalCompartilhado.id}
          petName={animalCompartilhado.nome}
          compartilhadoPor={animalCompartilhado.compartilhadoPor}
          onClose={() => setAnimalCompartilhado(null)}
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
        <h2>Clientes</h2>
        <button className="mobile-btn-novo-cliente" onClick={() => setShowNovoClienteModal(true)}>
          + Novo
        </button>
      </div>

      {/* Convites de compartilhamento recebidos (pendentes) */}
      {convites.length > 0 && (
        <div className="mobile-convites">
          <div className="mobile-convites-header">
            Convites recebidos
            <span className="mobile-convites-badge">{convites.length}</span>
          </div>
          {convites.map(conv => (
            <div key={conv.id} className="mobile-convite-item">
              <div className="mobile-convite-info">
                <span className="mconv-nome">{conv.Pet?.nome || 'Animal'} {conv.Pet?.especie ? `(${conv.Pet.especie})` : ''}</span>
                <span className="mconv-origem">de {conv.veterinarioOrigem?.nome || 'veterinário'}</span>
              </div>
              <div className="mobile-convite-acoes">
                <button
                  className="mconv-btn mconv-aceitar"
                  onClick={() => handleAceitarConvite(conv.id)}
                  disabled={processandoConvite === conv.id}
                >
                  {processandoConvite === conv.id ? '...' : <><Check size={14} /> Aceitar</>}
                </button>
                <button
                  className="mconv-btn mconv-recusar"
                  onClick={() => handleRecusarConvite(conv.id)}
                  disabled={processandoConvite === conv.id}
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Animais compartilhados comigo */}
      {compartilhados.length > 0 && (
        <div className="mobile-compartilhados">
          <div className="mobile-compartilhados-header">
            Compartilhados comigo
          </div>
          {compartilhados.map(comp => (
            <div
              key={comp.id}
              className="mobile-compartilhado-item"
              onClick={() => comp.Pet && setAnimalCompartilhado({ ...comp.Pet, compartilhadoPor: comp.veterinarioOrigem?.nome })}
            >
              <span className="mci-nome">{comp.Pet?.nome || 'Animal'}</span>
              <span className="mci-especie">{comp.Pet?.especie || ''}</span>
              <span className="mci-origem">de {comp.veterinarioOrigem?.nome || 'veterinário'}</span>
            </div>
          ))}
        </div>
      )}

      {/* Barra de busca */}
      <div className="mobile-busca-container">
        <input
          type="text"
          className="mobile-busca-input"
          placeholder="Buscar cliente..."
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
              <span className="mcri-nome">{cliente.nome}</span>
              <span className="mcri-tel">{cliente.telefone || '—'}</span>
              <span className="mcri-count">{cliente.Pets?.length || 0}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
