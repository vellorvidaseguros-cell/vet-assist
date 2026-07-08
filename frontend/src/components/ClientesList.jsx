import { useState, useEffect } from 'react'
import axios from 'axios'
import { formatarData } from '../utils/dateFormatter'
import { calcularIdade } from '../utils/idadeUtils'
import { petFotoUrl } from '../utils/petFotoUrl'
import './ClientesList.css'
import NovoClienteModal from './NovoClienteModal'
import TransferirProprietarioModal from './TransferirProprietarioModal'
import ConfirmModal from './ConfirmModal'
import QuoteModal from './QuoteModal'
import AnimalHistoryModal from './AnimalHistoryModal'

export default function ClientesList() {
  const [clientes, setClientes] = useState([])
  const [compartilhados, setCompartilhados] = useState([])
  const [convites, setConvites] = useState([])
  const [processandoConvite, setProcessandoConvite] = useState(null)
  const [animalCompartilhado, setAnimalCompartilhado] = useState(null)
  const [expandedClienteId, setExpandedClienteId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showNewClienteForm, setShowNewClienteForm] = useState(false)
  const [showNovoClienteModal, setShowNovoClienteModal] = useState(false)
  const [showNewAnimalForm, setShowNewAnimalForm] = useState(null)
  const [editingClienteId, setEditingClienteId] = useState(null)
  const [editingAnimalId, setEditingAnimalId] = useState(null)
  const [transferModal, setTransferModal] = useState({ open: false, pet: null })
  const [quoteModal, setQuoteModal] = useState({ open: false, cliente: null, pet: null })
  const [confirm, setConfirm] = useState({ open: false })
  const [fotoFile, setFotoFile] = useState(null)
  const [fotoPreview, setFotoPreview] = useState(null)

  const handleFotoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFotoFile(file)
    setFotoPreview(URL.createObjectURL(file))
  }

  const resetFoto = () => {
    setFotoFile(null)
    setFotoPreview(null)
  }

  const enviarFotoPet = async (petId) => {
    if (!fotoFile) return
    const formData = new FormData()
    formData.append('foto', fotoFile)
    await axios.post(`/api/pets/${petId}/foto`, formData)
  }

  const [clienteForm, setClienteForm] = useState({
    nome: '',
    telefone: '',
    email: '',
    cpf: '',
    endereco: '',
    cidade: '',
    estado: ''
  })

  const [animalForm, setAnimalForm] = useState({
    clienteId: '',
    nome: '',
    especie: '',
    raca: '',
    sexo: '',
    porte: '',
    dataNascimento: '',
    cor: '',
    microchip: ''
  })

  useEffect(() => {
    fetchClientes()
    fetchCompartilhados()
    fetchConvites()
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

  const handleCreateCliente = async (e) => {
    e.preventDefault()
    try {
      if (editingClienteId) {
        await handleUpdateCliente(e)
      } else {
        const response = await axios.post('/api/clientes', clienteForm)
        if (response.data.sucesso) {
          setClienteForm({
            nome: '',
            telefone: '',
            email: '',
            cpf: '',
            endereco: '',
            cidade: '',
            estado: ''
          })
          setShowNewClienteForm(false)
          await fetchClientes()
        }
      }
    } catch (err) {
      setError(err.response?.data?.erro || 'Erro ao criar cliente')
    }
  }

  const handleCreateAnimal = async (e, clienteId) => {
    e.preventDefault()
    try {
      if (editingAnimalId) {
        await handleUpdateAnimal(e, clienteId)
      } else {
        const response = await axios.post('/api/pets', {
          ...animalForm,
          clienteId
        })
        if (response.data.sucesso) {
          const novoPetId = response.data.data?.id
          if (novoPetId) await enviarFotoPet(novoPetId)
          setAnimalForm({
            clienteId: '',
            nome: '',
            especie: '',
            raca: '',
            sexo: '',
            porte: '',
            dataNascimento: '',
            cor: '',
            microchip: ''
          })
          resetFoto()
          setShowNewAnimalForm(null)
          await fetchClientes()
        }
      }
    } catch (err) {
      setError(err.response?.data?.erro || 'Erro ao criar animal')
    }
  }

  const handleDeleteCliente = (clienteId) => {
    setConfirm({
      open: true,
      title: 'Deletar Cliente',
      message: 'Tem certeza que deseja deletar este cliente? Você pode restaurá-lo na Lixeira depois, se precisar.',
      confirmText: 'Deletar',
      cancelText: 'Cancelar',
      confirmColor: 'danger',
      onConfirm: async () => {
        try {
          await axios.delete(`/api/clientes/${clienteId}`)
          await fetchClientes()
          setConfirm({ open: false })
        } catch (err) {
          setError('Erro ao deletar cliente')
          setConfirm({ open: false })
        }
      },
      onCancel: () => setConfirm({ open: false })
    })
  }

  const handleDeleteAnimal = (petId) => {
    setConfirm({
      open: true,
      title: 'Deletar Animal',
      message: 'Tem certeza que deseja deletar este animal? Você pode restaurá-lo na Lixeira depois, se precisar.',
      confirmText: 'Deletar',
      cancelText: 'Cancelar',
      confirmColor: 'danger',
      onConfirm: async () => {
        try {
          await axios.delete(`/api/pets/${petId}`)
          await fetchClientes()
          setConfirm({ open: false })
        } catch (err) {
          setError('Erro ao deletar animal')
          setConfirm({ open: false })
        }
      },
      onCancel: () => setConfirm({ open: false })
    })
  }

  const handleEditCliente = (cliente) => {
    setClienteForm(cliente)
    setEditingClienteId(cliente.id)
    setShowNewClienteForm(true)
  }

  const handleUpdateCliente = async (e) => {
    e.preventDefault()
    try {
      const response = await axios.put(`/api/clientes/${editingClienteId}`, clienteForm)
      if (response.data.sucesso) {
        setClienteForm({
          nome: '',
          telefone: '',
          email: '',
          cpf: '',
          endereco: '',
          cidade: '',
          estado: ''
        })
        setEditingClienteId(null)
        setShowNewClienteForm(false)
        await fetchClientes()
      }
    } catch (err) {
      setError(err.response?.data?.erro || 'Erro ao atualizar cliente')
    }
  }

  const handleEditAnimal = (animal) => {
    resetFoto()
    setAnimalForm({
      ...animal,
      dataNascimento: animal.dataNascimento
        ? new Date(animal.dataNascimento).toISOString().split('T')[0]
        : ''
    })
    setEditingAnimalId(animal.id)
    setShowNewAnimalForm(animal.clienteId)
  }

  const handleUpdateAnimal = async (e, clienteId) => {
    e.preventDefault()
    try {
      const response = await axios.put(`/api/pets/${editingAnimalId}`, animalForm)
      if (response.data.sucesso) {
        if (fotoFile) await enviarFotoPet(editingAnimalId)
        setAnimalForm({
          clienteId: '',
          nome: '',
          especie: '',
          raca: '',
          sexo: '',
          porte: '',
          dataNascimento: '',
          cor: '',
          microchip: ''
        })
        resetFoto()
        setEditingAnimalId(null)
        setShowNewAnimalForm(null)
        await fetchClientes()
      }
    } catch (err) {
      setError(err.response?.data?.erro || 'Erro ao atualizar animal')
    }
  }

  if (loading) return <div className="loading">Carregando...</div>

  return (
    <div className="clientes-container">
      {showNovoClienteModal && (
        <NovoClienteModal
          onClose={() => setShowNovoClienteModal(false)}
          onSuccess={fetchClientes}
        />
      )}
      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError('')}>×</button>
        </div>
      )}

      <div className="clientes-header">
        <h2>Clientes</h2>
        <button
          className="btn-primary"
          onClick={() => setShowNovoClienteModal(true)}
        >
          + Novo Cliente
        </button>
      </div>

      {/* Convites de compartilhamento recebidos (pendentes de aceite) */}
      {convites.length > 0 && (
        <div className="convites-recebidos-desktop">
          <div className="convites-recebidos-titulo">
            📨 Convites recebidos
            <span className="convites-recebidos-badge">{convites.length}</span>
          </div>
          <div className="convites-recebidos-lista">
            {convites.map(conv => (
              <div key={conv.id} className="convite-recebido-item">
                <div className="crd-info">
                  <span className="crd-nome">🐾 {conv.Pet?.nome || 'Animal'} {conv.Pet?.especie ? `(${conv.Pet.especie})` : ''}</span>
                  <span className="crd-origem">de {conv.veterinarioOrigem?.nome || 'veterinário'}</span>
                </div>
                <div className="crd-acoes">
                  <button
                    className="crd-btn crd-aceitar"
                    onClick={() => handleAceitarConvite(conv.id)}
                    disabled={processandoConvite === conv.id}
                  >
                    {processandoConvite === conv.id ? '...' : '✓ Aceitar'}
                  </button>
                  <button
                    className="crd-btn crd-recusar"
                    onClick={() => handleRecusarConvite(conv.id)}
                    disabled={processandoConvite === conv.id}
                  >
                    ✕ Recusar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Animais compartilhados comigo por outros veterinários */}
      {compartilhados.length > 0 && (
        <div className="compartilhados-comigo-desktop">
          <div className="compartilhados-comigo-titulo">🔗 Compartilhados comigo</div>
          <div className="compartilhados-comigo-lista">
            {compartilhados.map(comp => (
              <div
                key={comp.id}
                className="compartilhado-comigo-item-desktop"
                onClick={() => comp.Pet && setAnimalCompartilhado({ ...comp.Pet, compartilhadoPor: comp.veterinarioOrigem?.nome })}
              >
                <span className="ccd-nome">🐾 {comp.Pet?.nome || 'Animal'}</span>
                <span className="ccd-especie">{comp.Pet?.especie || ''}</span>
                <span className="ccd-origem">de {comp.veterinarioOrigem?.nome || 'veterinário'}</span>
                <span className="ccd-seta">▶</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {animalCompartilhado && (
        <AnimalHistoryModal
          petId={animalCompartilhado.id}
          petName={animalCompartilhado.nome}
          compartilhadoPor={animalCompartilhado.compartilhadoPor}
          onClose={() => setAnimalCompartilhado(null)}
        />
      )}

      {/* Formulário inline só para EDIÇÃO de cliente existente */}
      {showNewClienteForm && editingClienteId && (
        <form className="form-card" onSubmit={handleUpdateCliente}>
          <div className="form-row">
            <div className="form-group">
              <label>Nome *</label>
              <input
                type="text"
                value={clienteForm.nome}
                onChange={(e) => setClienteForm({ ...clienteForm, nome: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Telefone *</label>
              <input
                type="tel"
                value={clienteForm.telefone}
                onChange={(e) => setClienteForm({ ...clienteForm, telefone: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={clienteForm.email}
                onChange={(e) => setClienteForm({ ...clienteForm, email: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>CPF</label>
              <input
                type="text"
                value={clienteForm.cpf}
                onChange={(e) => setClienteForm({ ...clienteForm, cpf: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Endereço</label>
              <input
                type="text"
                value={clienteForm.endereco}
                onChange={(e) => setClienteForm({ ...clienteForm, endereco: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Cidade</label>
              <input
                type="text"
                value={clienteForm.cidade}
                onChange={(e) => setClienteForm({ ...clienteForm, cidade: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Estado</label>
              <input
                type="text"
                value={clienteForm.estado}
                maxLength="2"
                onChange={(e) => setClienteForm({ ...clienteForm, estado: e.target.value })}
              />
            </div>
          </div>

          <div style={{display: 'flex', gap: '1rem'}}>
            <button type="submit" className="btn-primary">Atualizar Cliente</button>
            <button
              type="button"
              className="btn-danger"
              onClick={() => {
                setEditingClienteId(null);
                setShowNewClienteForm(false);
                setClienteForm({ nome: '', telefone: '', email: '', cpf: '', endereco: '', cidade: '', estado: '' });
              }}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="clientes-list">
        {clientes.length === 0 ? (
          <p className="empty-message">Nenhum cliente cadastrado</p>
        ) : (
          clientes.map(cliente => (
            <div key={cliente.id} className="cliente-accordion">
              <div
                className="cliente-header"
                onClick={() => setExpandedClienteId(
                  expandedClienteId === cliente.id ? null : cliente.id
                )}
              >
                <div className="cliente-info">
                  <div className="cliente-col-nome">
                    <span>👤 {cliente.nome}</span>
                  </div>
                  <div className="cliente-col-telefone">
                    <span>📞 {cliente.telefone}</span>
                  </div>
                  <div className="cliente-col-animais">
                    <span>🐾 {cliente.Pets?.length || 0} animal(is)</span>
                  </div>
                </div>
                <div className="expand-icon">
                  {expandedClienteId === cliente.id ? '▼' : '▶'}
                </div>
              </div>

              {expandedClienteId === cliente.id && (
                <div className="cliente-content">
                  <div className="cliente-details-section">
                    <h4>Informações do Cliente</h4>
                    <p><strong>CPF:</strong> {cliente.cpf || 'N/A'}</p>
                    <p><strong>Endereço:</strong> {cliente.endereco || 'N/A'}</p>
                    <p><strong>Cidade/Estado:</strong> {cliente.cidade}/{cliente.estado}</p>
                    <p><strong>Última Consulta:</strong> {cliente.dataUltimaConsulta ? formatarData(cliente.dataUltimaConsulta) : 'N/A'}</p>
                  </div>

                  <div className="animais-section">
                    <div className="animais-header">
                      <h4>🐾 Animais</h4>
                      <button
                        className="btn-small"
                        onClick={() => {
                          resetFoto()
                          setShowNewAnimalForm(showNewAnimalForm === cliente.id ? null : cliente.id)
                        }}
                      >
                        + Adicionar Animal
                      </button>
                    </div>

                    {showNewAnimalForm === cliente.id && (
                      <form className="animal-form" onSubmit={(e) => handleCreateAnimal(e, cliente.id)}>
                        <div className="foto-picker">
                          <label htmlFor="animal-foto-input" className="foto-preview">
                            {fotoPreview ? (
                              <img src={fotoPreview} alt="Foto do animal" />
                            ) : editingAnimalId && animalForm.foto ? (
                              <img src={petFotoUrl(editingAnimalId)} alt="Foto do animal" />
                            ) : (
                              <span className="foto-placeholder">🐾</span>
                            )}
                          </label>
                          <input
                            id="animal-foto-input"
                            type="file"
                            accept="image/*"
                            onChange={handleFotoChange}
                            style={{ display: 'none' }}
                          />
                          <label htmlFor="animal-foto-input" className="foto-btn">
                            📷 {fotoPreview || (editingAnimalId && animalForm.foto) ? 'Trocar Foto' : 'Adicionar Foto'}
                          </label>
                        </div>

                        <div className="form-row">
                          <div className="form-group">
                            <label>Nome *</label>
                            <input
                              type="text"
                              value={animalForm.nome}
                              onChange={(e) => setAnimalForm({ ...animalForm, nome: e.target.value })}
                              required
                            />
                          </div>
                          <div className="form-group">
                            <label>Espécie *</label>
                            <input
                              type="text"
                              value={animalForm.especie}
                              onChange={(e) => setAnimalForm({ ...animalForm, especie: e.target.value })}
                              required
                            />
                          </div>
                        </div>

                        <div className="form-row">
                          <div className="form-group">
                            <label>Raça</label>
                            <input
                              type="text"
                              value={animalForm.raca}
                              onChange={(e) => setAnimalForm({ ...animalForm, raca: e.target.value })}
                            />
                          </div>
                          <div className="form-group">
                            <label>Sexo</label>
                            <select
                              value={animalForm.sexo}
                              onChange={(e) => setAnimalForm({ ...animalForm, sexo: e.target.value })}
                            >
                              <option value="">Selecione</option>
                              <option value="M">Macho</option>
                              <option value="F">Fêmea</option>
                            </select>
                          </div>
                        </div>

                        <div className="form-row">
                          <div className="form-group">
                            <label>Porte</label>
                            <select
                              value={animalForm.porte}
                              onChange={(e) => setAnimalForm({ ...animalForm, porte: e.target.value })}
                            >
                              <option value="">Selecione</option>
                              <option value="P">Pequeno</option>
                              <option value="M">Médio</option>
                              <option value="G">Grande</option>
                            </select>
                          </div>
                          <div className="form-group">
                            <label>Data de Nascimento</label>
                            <input
                              type="date"
                              max={new Date().toISOString().split('T')[0]}
                              value={animalForm.dataNascimento}
                              onChange={(e) => setAnimalForm({ ...animalForm, dataNascimento: e.target.value })}
                            />
                            {animalForm.dataNascimento && (
                              <span className="idade-calculada">
                                🎂 {calcularIdade(animalForm.dataNascimento).texto}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="form-row">
                          <div className="form-group">
                            <label>Cor</label>
                            <input
                              type="text"
                              value={animalForm.cor}
                              onChange={(e) => setAnimalForm({ ...animalForm, cor: e.target.value })}
                            />
                          </div>
                          <div className="form-group">
                            <label>Microchip</label>
                            <input
                              type="text"
                              value={animalForm.microchip}
                              onChange={(e) => setAnimalForm({ ...animalForm, microchip: e.target.value })}
                            />
                          </div>
                        </div>

                        <button type="submit" className="btn-primary">Salvar Animal</button>
                      </form>
                    )}

                    {cliente.Pets && cliente.Pets.length > 0 ? (
                      <div className="animais-list">
                        {cliente.Pets.map(pet => (
                          <div key={pet.id} className="animal-card">
                            {pet.foto ? (
                              <img src={petFotoUrl(pet.id)} alt={pet.nome} className="animal-avatar" />
                            ) : (
                              <span className="animal-avatar animal-avatar-placeholder">🐾</span>
                            )}
                            <div className="animal-info">
                              <div className="animal-card-title">
                                <span><strong>{pet.nome}</strong> <span className="animal-especie">({pet.especie})</span></span>
                                {(pet.dataNascimento || pet.idade) && (
                                  <span className="animal-idade">
                                    🎂 {pet.dataNascimento ? calcularIdade(pet.dataNascimento).texto : `${pet.idade} ano${pet.idade !== 1 ? 's' : ''}`}
                                  </span>
                                )}
                                <span className="animal-codigo">PET-{String(pet.id).padStart(6, '0')}</span>
                              </div>
                              <div className="animal-chips">
                                {pet.raca && <span className="chip">{pet.raca}</span>}
                                {pet.sexo && <span className="chip">{pet.sexo === 'M' ? 'Macho' : pet.sexo === 'F' ? 'Fêmea' : pet.sexo}</span>}
                                {pet.porte && <span className="chip">{pet.porte === 'P' ? 'Pequeno' : pet.porte === 'M' ? 'Médio' : pet.porte === 'G' ? 'Grande' : pet.porte}</span>}
                              </div>
                            </div>
                            <div className="animal-actions">
                              <button
                                className="btn-quote"
                                onClick={() => setQuoteModal({ open: true, cliente, pet })}
                                title="Gerar orçamento"
                              >
                                💰 Orçamento
                              </button>
                              <button
                                className="btn-transfer"
                                onClick={() => setTransferModal({ open: true, pet })}
                                title="Transferir para outro proprietário"
                              >
                                🔄 Transferir
                              </button>
                              <button
                                className="btn-edit"
                                onClick={() => handleEditAnimal(pet)}
                              >
                                ✏️ Editar
                              </button>
                              <button
                                className="btn-danger"
                                onClick={() => handleDeleteAnimal(pet.id)}
                              >
                                Deletar
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="no-animals">Nenhum animal cadastrado</p>
                    )}
                  </div>

                  <div className="cliente-actions">
                    <button
                      className="btn-edit"
                      onClick={() => handleEditCliente(cliente)}
                    >
                      ✏️ Editar
                    </button>
                    <button
                      className="btn-danger"
                      onClick={() => handleDeleteCliente(cliente.id)}
                    >
                      Deletar Cliente
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {transferModal.open && (
        <TransferirProprietarioModal
          pet={transferModal.pet}
          clientes={clientes}
          onClose={() => setTransferModal({ open: false, pet: null })}
          onSuccess={fetchClientes}
        />
      )}

      {quoteModal.open && (
        <QuoteModal
          cliente={quoteModal.cliente}
          pet={quoteModal.pet}
          onClose={() => setQuoteModal({ open: false, cliente: null, pet: null })}
        />
      )}

      <ConfirmModal {...confirm} />
    </div>
  )
}
