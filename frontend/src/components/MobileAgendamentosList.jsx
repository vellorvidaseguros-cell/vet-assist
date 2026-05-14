import { useState, useEffect } from 'react'
import axios from 'axios'
import PhotoUploadModal from './PhotoUploadModal'
import StatusMenu from './StatusMenu'
import { formatarData } from '../utils/dateFormatter'
import './MobileAgendamentosList.css'

const DEFAULT_PRICES = {
  'Consulta': 150,
  'Vacinação': 80,
  'Banho e Tosa': 120,
  'Cirurgia': 500,
  'Ultrassom': 200,
  'Radiografia': 180,
  'Retorno': 100,
  'Atendimento Emergencial': 300,
  'Limpeza': 100,
  'Outro': 0
}

export default function MobileAgendamentosList() {
  const [agendamentos, setAgendamentos] = useState([])
  const [clientes, setClientes] = useState([])
  const [pets, setPets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [selectedCliente, setSelectedCliente] = useState('')
  const [showPhotoModal, setShowPhotoModal] = useState(false)
  const [selectedAgendamentoId, setSelectedAgendamentoId] = useState(null)
  const [editingAgendamentoId, setEditingAgendamentoId] = useState(null)
  const [tabelaPrecos, setTabelaPrecos] = useState({})
  const [filtroStatus, setFiltroStatus] = useState('Todos')
  const [formData, setFormData] = useState({
    petId: '',
    clienteId: '',
    data: '',
    hora: '',
    tipoAtendimento: '',
    descricao: '',
    observacoes: '',
    valor: 0
  })

  useEffect(() => {
    fetchData()
    fetchPrices()
  }, [])

  const fetchPrices = async () => {
    try {
      const res = await axios.get('/api/perfil')
      if (res.data.sucesso && res.data.data?.tabelaPrecos) {
        setTabelaPrecos(res.data.data.tabelaPrecos)
      }
    } catch (err) {
      console.error('Erro ao carregar tabela de preços:', err)
    }
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      const [agendRes, clientesRes, petsRes] = await Promise.all([
        axios.get('/api/agendamentos'),
        axios.get('/api/clientes'),
        axios.get('/api/pets')
      ])
      if (agendRes.data.sucesso) setAgendamentos(agendRes.data.data || [])
      if (clientesRes.data.sucesso) setClientes(clientesRes.data.data || [])
      if (petsRes.data.sucesso) setPets(petsRes.data.data || [])
    } catch (err) {
      setError('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  const getPrice = (tipoAtendimento) => {
    if (tabelaPrecos[tipoAtendimento]) {
      return tabelaPrecos[tipoAtendimento]
    }
    return DEFAULT_PRICES[tipoAtendimento] || 0
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target

    if (name === 'tipoAtendimento') {
      const preco = getPrice(value)
      setFormData(prev => ({
        ...prev,
        [name]: value,
        valor: preco
      }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleClienteChange = (e) => {
    setSelectedCliente(e.target.value)
    setFormData(prev => ({ ...prev, clienteId: e.target.value, petId: '' }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        ...formData,
        valor: parseFloat(formData.valor) || 0
      }

      let response
      if (editingAgendamentoId) {
        response = await axios.put(`/api/agendamentos/${editingAgendamentoId}`, payload)
      } else {
        response = await axios.post('/api/agendamentos', payload)
      }

      if (response.data.sucesso) {
        setFormData({
          petId: '',
          clienteId: '',
          data: '',
          hora: '',
          tipoAtendimento: '',
          descricao: '',
          observacoes: '',
          valor: 0
        })
        setSelectedCliente('')
        setShowForm(false)
        setEditingAgendamentoId(null)
        await fetchData()
      }
    } catch (err) {
      const msgErro = editingAgendamentoId ? 'Erro ao atualizar agendamento' : 'Erro ao criar agendamento'
      setError(err.response?.data?.erro || msgErro)
    }
  }

  const petsPorCliente = selectedCliente
    ? pets.filter(p => p.clienteId === parseInt(selectedCliente))
    : []

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja deletar este agendamento?')) {
      try {
        const response = await axios.delete(`/api/agendamentos/${id}`)
        if (response.data.sucesso) {
          setError('')
          await fetchData()
        }
      } catch (err) {
        setError('Erro ao deletar agendamento')
      }
    }
  }

  const handleStatusChange = async (agendamentoId, novoStatus) => {
    if (window.confirm(`Tem certeza que deseja marcar como ${novoStatus}?`)) {
      try {
        const response = await axios.put(`/api/agendamentos/${agendamentoId}`, {
          status: novoStatus
        })
        if (response.data.sucesso) {
          setError('')
          await fetchData()
        }
      } catch (err) {
        setError(err.response?.data?.erro || 'Erro ao atualizar status')
      }
    }
  }

  const handlePhotoButtonClick = (agendamentoId) => {
    setSelectedAgendamentoId(agendamentoId)
    setShowPhotoModal(true)
  }

  const handlePhotoUploadSuccess = () => {
    fetchData()
  }

  const handleEdit = (agendamento) => {
    setEditingAgendamentoId(agendamento.id)
    setSelectedCliente(agendamento.clienteId.toString())
    setFormData({
      petId: agendamento.petId,
      clienteId: agendamento.clienteId,
      data: agendamento.data.split('T')[0],
      hora: agendamento.hora,
      tipoAtendimento: agendamento.tipoAtendimento,
      descricao: agendamento.descricao,
      observacoes: agendamento.observacoes,
      valor: agendamento.valor || 0
    })
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Filtrar agendamentos por status
  const agendamentosFiltrados = filtroStatus === 'Todos'
    ? agendamentos
    : agendamentos.filter(a => a.status === filtroStatus)

  if (loading) return <div className="mobile-loading">Carregando...</div>

  return (
    <div className="mobile-agendamentos-container">
      <div className="mobile-agendamentos-header">
        <h2>Agendamentos</h2>
        <button
          className="mobile-btn-novo-agendamento"
          onClick={() => {
            setShowForm(!showForm)
            if (showForm) {
              setEditingAgendamentoId(null)
              setFormData({
                petId: '',
                clienteId: '',
                data: '',
                hora: '',
                tipoAtendimento: '',
                descricao: '',
                observacoes: '',
                valor: 0
              })
              setSelectedCliente('')
            }
          }}
        >
          {showForm ? '✕' : '+'} {showForm ? 'Cancelar' : 'Novo'}
        </button>
      </div>

      {error && (
        <div className="mobile-error">
          {error}
          <button onClick={() => setError('')}>×</button>
        </div>
      )}

      {showPhotoModal && (
        <PhotoUploadModal
          agendamentoId={selectedAgendamentoId}
          onClose={() => setShowPhotoModal(false)}
          onUploadSuccess={handlePhotoUploadSuccess}
        />
      )}

      {showForm && (
        <form className="mobile-form-card" onSubmit={handleSubmit}>
          <div className="mobile-form-row">
            <div className="mobile-form-group">
              <label>Cliente *</label>
              <select
                value={selectedCliente}
                onChange={handleClienteChange}
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
            <div className="mobile-form-group">
              <label>Pet *</label>
              <select
                name="petId"
                value={formData.petId}
                onChange={handleInputChange}
                required
                disabled={!selectedCliente}
              >
                <option value="">Selecione um pet</option>
                {petsPorCliente.map(pet => (
                  <option key={pet.id} value={pet.id}>
                    {pet.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mobile-form-row">
            <div className="mobile-form-group">
              <label>Data *</label>
              <input
                type="date"
                name="data"
                value={formData.data}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="mobile-form-group">
              <label>Hora *</label>
              <input
                type="time"
                name="hora"
                value={formData.hora}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="mobile-form-row">
            <div className="mobile-form-group">
              <label>Tipo de Atendimento</label>
              <select name="tipoAtendimento" value={formData.tipoAtendimento} onChange={handleInputChange}>
                <option value="">Selecione</option>
                <option value="Consulta">Consulta</option>
                <option value="Vacinação">Vacinação</option>
                <option value="Banho e Tosa">Banho e Tosa</option>
                <option value="Limpeza">Limpeza</option>
                <option value="Cirurgia">Cirurgia</option>
                <option value="Ultrassom">Ultrassom</option>
                <option value="Radiografia">Radiografia</option>
                <option value="Retorno">Retorno</option>
                <option value="Atendimento Emergencial">Atendimento Emergencial</option>
                <option value="Outro">Outro</option>
              </select>
            </div>
            <div className="mobile-form-group">
              <label>Valor (R$)</label>
              <input
                type="number"
                step="0.01"
                name="valor"
                value={formData.valor}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="mobile-form-group">
            <label>Descrição</label>
            <input
              type="text"
              name="descricao"
              value={formData.descricao}
              onChange={handleInputChange}
              placeholder="Motivo da consulta"
            />
          </div>

          <div className="mobile-form-group">
            <label>Observações</label>
            <input
              type="text"
              name="observacoes"
              value={formData.observacoes}
              onChange={handleInputChange}
            />
          </div>

          <button type="submit" className="mobile-btn-submit">
            {editingAgendamentoId ? '✏️ Atualizar' : '➕ Criar'}
          </button>
        </form>
      )}

      {/* Filtros */}
      <div className="mobile-agendamentos-filtros">
        {['Todos', 'Pendente', 'Concluído', 'Cancelado'].map(status => (
          <button
            key={status}
            className={`filtro-btn ${filtroStatus === status ? 'ativo' : ''}`}
            onClick={() => setFiltroStatus(status)}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Lista de Agendamentos */}
      <div className="mobile-agendamentos-list">
        {agendamentosFiltrados.length === 0 ? (
          <div className="mobile-agendamentos-empty">
            Nenhum agendamento cadastrado
          </div>
        ) : (
          agendamentosFiltrados.map(agend => (
            <div key={agend.id} className="mobile-agendamento-card">
              <div className="agendamento-card-header">
                <div className="agendamento-header-left">
                  <span className={`status-badge ${agend.status?.toLowerCase()}`}>
                    {agend.status}
                  </span>
                  <span className="agendamento-data">{formatarData(agend.data)}</span>
                </div>
                <span className="agendamento-hora">{agend.hora}</span>
              </div>

              <div className="agendamento-card-body">
                <div className="agendamento-info-row">
                  <span className="label">👤 Cliente:</span>
                  <span className="value">{agend.Cliente?.nome}</span>
                </div>
                <div className="agendamento-info-row">
                  <span className="label">🐾 Animal:</span>
                  <span className="value">{agend.Pet?.nome}</span>
                </div>
                <div className="agendamento-info-row">
                  <span className="label">💼 Tipo:</span>
                  <span className="value">{agend.tipoAtendimento}</span>
                </div>
                {agend.descricao && (
                  <div className="agendamento-info-row">
                    <span className="label">📝 Descrição:</span>
                    <span className="value">{agend.descricao}</span>
                  </div>
                )}
                <div className="agendamento-info-row">
                  <span className="label">💰 Valor:</span>
                  <span className="value">
                    R$ {parseFloat(agend.valor).toLocaleString('pt-BR', {
                      minimumFractionDigits: 2
                    })}
                  </span>
                </div>
              </div>

              <div className="agendamento-card-actions">
                <StatusMenu
                  currentStatus={agend.status}
                  onStatusChange={handleStatusChange}
                  agendamentoId={agend.id}
                />
                <button
                  className="btn-action btn-photo"
                  onClick={() => handlePhotoButtonClick(agend.id)}
                  title="Adicionar fotos"
                >
                  📸
                </button>
                <button
                  className="btn-action btn-edit"
                  onClick={() => handleEdit(agend)}
                  title="Editar"
                >
                  ✏️
                </button>
                <button
                  className="btn-action btn-delete"
                  onClick={() => handleDelete(agend.id)}
                  title="Deletar"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
