import { useState, useEffect } from 'react'
import axios from 'axios'
import { formatarData } from '../utils/dateFormatter'
import './ClientesList.css'

export default function ClientesList() {
  const [clientes, setClientes] = useState([])
  const [expandedClienteId, setExpandedClienteId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showNewClienteForm, setShowNewClienteForm] = useState(false)
  const [showNewAnimalForm, setShowNewAnimalForm] = useState(null)
  const [editingClienteId, setEditingClienteId] = useState(null)
  const [editingAnimalId, setEditingAnimalId] = useState(null)

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
    idade: '',
    cor: '',
    microchip: ''
  })

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
    } finally {
      setLoading(false)
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
          setAnimalForm({
            clienteId: '',
            nome: '',
            especie: '',
            raca: '',
            sexo: '',
            porte: '',
            idade: '',
            cor: '',
            microchip: ''
          })
          setShowNewAnimalForm(null)
          await fetchClientes()
        }
      }
    } catch (err) {
      setError(err.response?.data?.erro || 'Erro ao criar animal')
    }
  }

  const handleDeleteCliente = async (clienteId) => {
    if (confirm('Tem certeza que deseja deletar este cliente?')) {
      try {
        await axios.delete(`/api/clientes/${clienteId}`)
        await fetchClientes()
      } catch (err) {
        setError('Erro ao deletar cliente')
      }
    }
  }

  const handleDeleteAnimal = async (petId) => {
    if (confirm('Tem certeza que deseja deletar este animal?')) {
      try {
        await axios.delete(`/api/pets/${petId}`)
        await fetchClientes()
      } catch (err) {
        setError('Erro ao deletar animal')
      }
    }
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
    setAnimalForm(animal)
    setEditingAnimalId(animal.id)
    setShowNewAnimalForm(animal.clienteId)
  }

  const handleUpdateAnimal = async (e, clienteId) => {
    e.preventDefault()
    try {
      const response = await axios.put(`/api/pets/${editingAnimalId}`, animalForm)
      if (response.data.sucesso) {
        setAnimalForm({
          clienteId: '',
          nome: '',
          especie: '',
          raca: '',
          sexo: '',
          porte: '',
          idade: '',
          cor: '',
          microchip: ''
        })
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
          onClick={() => setShowNewClienteForm(!showNewClienteForm)}
        >
          {showNewClienteForm ? 'Cancelar' : '+ Novo Cliente'}
        </button>
      </div>

      {showNewClienteForm && (
        <form className="form-card" onSubmit={editingClienteId ? handleUpdateCliente : handleCreateCliente}>
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
            <button type="submit" className="btn-primary">
              {editingClienteId ? 'Atualizar Cliente' : 'Salvar Cliente'}
            </button>
            {editingClienteId && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setEditingClienteId(null);
                  setShowNewClienteForm(false);
                  setClienteForm({
                    nome: '',
                    telefone: '',
                    email: '',
                    cpf: '',
                    endereco: '',
                    cidade: '',
                    estado: ''
                  });
                }}
              >
                Cancelar
              </button>
            )}
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
                        onClick={() => setShowNewAnimalForm(
                          showNewAnimalForm === cliente.id ? null : cliente.id
                        )}
                      >
                        + Adicionar Animal
                      </button>
                    </div>

                    {showNewAnimalForm === cliente.id && (
                      <form className="animal-form" onSubmit={(e) => handleCreateAnimal(e, cliente.id)}>
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
                            <label>Idade</label>
                            <input
                              type="number"
                              value={animalForm.idade}
                              onChange={(e) => setAnimalForm({ ...animalForm, idade: e.target.value })}
                            />
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
                            <div className="animal-info">
                              <p className="animal-name">🐾 <strong>{pet.nome}</strong> ({pet.especie})</p>
                              <p className="animal-details">
                                Raça: {pet.raca || 'N/A'} | Sexo: {pet.sexo || 'N/A'} | Porte: {pet.porte || 'N/A'}
                              </p>
                            </div>
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
    </div>
  )
}
