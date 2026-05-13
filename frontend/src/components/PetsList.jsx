import { useState, useEffect } from 'react'
import axios from 'axios'
import './List.css'

export default function PetsList() {
  const [pets, setPets] = useState([])
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
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
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [petsRes, clientesRes] = await Promise.all([
        axios.get('/api/pets'),
        axios.get('/api/clientes')
      ])
      if (petsRes.data.sucesso) setPets(petsRes.data.data || [])
      if (clientesRes.data.sucesso) setClientes(clientesRes.data.data || [])
    } catch (err) {
      setError('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const response = await axios.post('/api/pets', formData)
      if (response.data.sucesso) {
        setFormData({
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
        setShowForm(false)
        await fetchData()
      }
    } catch (err) {
      setError(err.response?.data?.erro || 'Erro ao criar pet')
    }
  }

  if (loading) return <div className="loading">Carregando...</div>

  return (
    <div className="list-container">
      <div className="list-header">
        <h2>Pets</h2>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : '+ Novo Pet'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && (
        <form className="form-card" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Cliente *</label>
              <select
                name="clienteId"
                value={formData.clienteId}
                onChange={handleInputChange}
                required
              >
                <option value="">Selecione um cliente</option>
                {clientes.map(cliente => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nome}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Nome *</label>
              <input
                type="text"
                name="nome"
                value={formData.nome}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Espécie *</label>
              <input
                type="text"
                name="especie"
                value={formData.especie}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Raça</label>
              <input
                type="text"
                name="raca"
                value={formData.raca}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Sexo</label>
              <select name="sexo" value={formData.sexo} onChange={handleInputChange}>
                <option value="">Selecione</option>
                <option value="M">Macho</option>
                <option value="F">Fêmea</option>
              </select>
            </div>
            <div className="form-group">
              <label>Porte</label>
              <select name="porte" value={formData.porte} onChange={handleInputChange}>
                <option value="">Selecione</option>
                <option value="P">Pequeno</option>
                <option value="M">Médio</option>
                <option value="G">Grande</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Idade</label>
              <input
                type="number"
                name="idade"
                value={formData.idade}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label>Cor</label>
              <input
                type="text"
                name="cor"
                value={formData.cor}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Microchip</label>
              <input
                type="text"
                name="microchip"
                value={formData.microchip}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <button type="submit" className="btn-primary">Salvar Pet</button>
        </form>
      )}

      <div className="list-content">
        {pets.length === 0 ? (
          <p className="empty-message">Nenhum pet cadastrado</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Espécie</th>
                <th>Raça</th>
                <th>Cliente</th>
                <th>Porte</th>
              </tr>
            </thead>
            <tbody>
              {pets.map(pet => (
                <tr key={pet.id}>
                  <td>{pet.nome}</td>
                  <td>{pet.especie}</td>
                  <td>{pet.raca}</td>
                  <td>{pet.Cliente?.nome}</td>
                  <td>{pet.porte}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
