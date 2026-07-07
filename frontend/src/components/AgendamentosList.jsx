import { useState, useEffect } from 'react'
import axios from 'axios'
import PhotoUploadModal from './PhotoUploadModal'
import ConfirmModal from './ConfirmModal'
import StatusMenu from './StatusMenu'
import { formatarData } from '../utils/dateFormatter'
import { HORARIOS } from '../utils/horariosDisponiveis'
import { parseValorBR, formatarValorBR } from '../utils/moeda'
import './List.css'

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

export default function AgendamentosList() {
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
  const [confirm, setConfirm] = useState({ open: false })
  const [tabelaPrecos, setTabelaPrecos] = useState({})
  const [formData, setFormData] = useState({
    petId: '',
    clienteId: '',
    data: '',
    hora: '',
    tipoAtendimento: '',
    descricao: '',
    observacoes: '',
    valor: ''
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
    // Prioridade: valor customizado > valor padrão > DEFAULT_PRICES
    if (tabelaPrecos[tipoAtendimento]) {
      return tabelaPrecos[tipoAtendimento]
    }
    return DEFAULT_PRICES[tipoAtendimento] || 0
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target

    // Se mudou o tipo de atendimento, atualiza o valor automaticamente
    if (name === 'tipoAtendimento') {
      const preco = getPrice(value)
      setFormData(prev => ({
        ...prev,
        [name]: value,
        valor: formatarValorBR(preco)
      }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  // Ao focar no campo Valor: mostra só o número, sem formatação, para facilitar edição
  const handleValorFocus = () => {
    const num = parseValorBR(formData.valor)
    if (num !== null) setFormData(prev => ({ ...prev, valor: String(num) }))
  }

  // Ao sair do campo Valor: formata para o padrão BR (150,00)
  const handleValorBlur = () => {
    const num = parseValorBR(formData.valor)
    setFormData(prev => ({ ...prev, valor: num !== null ? formatarValorBR(num) : '' }))
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
        valor: parseValorBR(formData.valor) || 0
      }

      let response
      if (editingAgendamentoId) {
        // Atualizar agendamento existente
        response = await axios.put(`/api/agendamentos/${editingAgendamentoId}`, payload)
      } else {
        // Criar novo agendamento
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
          valor: ''
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

  const handleDelete = (id) => {
    setConfirm({
      open: true,
      title: 'Deletar Agendamento',
      message: 'Tem certeza que deseja deletar este agendamento? Você pode restaurá-lo na Lixeira depois, se precisar.',
      confirmText: 'Deletar',
      cancelText: 'Cancelar',
      confirmColor: 'danger',
      onConfirm: async () => {
        try {
          const response = await axios.delete(`/api/agendamentos/${id}`)
          if (response.data.sucesso) {
            setError('')
            await fetchData()
            setConfirm({ open: false })
          }
        } catch (err) {
          setError('Erro ao deletar agendamento')
          setConfirm({ open: false })
        }
      },
      onCancel: () => setConfirm({ open: false })
    })
  }

  const handleStatusChange = (agendamentoId, novoStatus) => {
    setConfirm({
      open: true,
      title: 'Alterar Status',
      message: `Tem certeza que deseja marcar como ${novoStatus}?`,
      confirmText: 'Confirmar',
      cancelText: 'Cancelar',
      confirmColor: 'primary',
      onConfirm: async () => {
        try {
          const response = await axios.put(`/api/agendamentos/${agendamentoId}`, {
            status: novoStatus
          })
          if (response.data.sucesso) {
            setError('')
            await fetchData()
            setConfirm({ open: false })
          }
        } catch (err) {
          setError('Erro ao atualizar status')
          setConfirm({ open: false })
        }
      },
      onCancel: () => setConfirm({ open: false })
    })
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
      valor: formatarValorBR(agendamento.valor || 0)
    })
    setSelectedCliente(agendamento.clienteId.toString())
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (loading) return <div className="loading">Carregando...</div>

  return (
    <div className="list-container">
      <div className="list-header">
        <h2>Agendamentos</h2>
        <button
          className="btn-primary"
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
                valor: ''
              })
              setSelectedCliente('')
            }
          }}
        >
          {showForm ? 'Cancelar' : '+ Novo Agendamento'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showPhotoModal && (
        <PhotoUploadModal
          agendamentoId={selectedAgendamentoId}
          onClose={() => setShowPhotoModal(false)}
          onUploadSuccess={handlePhotoUploadSuccess}
        />
      )}

      {showForm && (
        <form className="form-card" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
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
            <div className="form-group">
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
                    {pet.nome} ({pet.especie})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Data *</label>
              <input
                type="date"
                name="data"
                value={formData.data}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Hora *</label>
              <select
                name="hora"
                value={formData.hora}
                onChange={handleInputChange}
                required
              >
                <option value="">Selecione</option>
                {HORARIOS.map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
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
            <div className="form-group">
              <label>Valor (R$)</label>
              <input
                type="text"
                inputMode="decimal"
                name="valor"
                value={formData.valor}
                onChange={handleInputChange}
                onFocus={handleValorFocus}
                onBlur={handleValorBlur}
                placeholder="0,00"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Descrição</label>
              <input
                type="text"
                name="descricao"
                value={formData.descricao}
                onChange={handleInputChange}
                placeholder="Motivo da consulta"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Observações</label>
              <input
                type="text"
                name="observacoes"
                value={formData.observacoes}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <button type="submit" className="btn-primary">
            {editingAgendamentoId ? '✏️ Atualizar Agendamento' : '➕ Criar Agendamento'}
          </button>
        </form>
      )}

      <div className="list-content">
        {agendamentos.length === 0 ? (
          <p className="empty-message">Nenhum agendamento cadastrado</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Data</th>
                <th>Hora</th>
                <th>Tipo</th>
                <th>Animal</th>
                <th>Cliente</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {agendamentos.map(agend => (
                <tr key={agend.id}>
                  <td>
                    <span className={`status-badge ${agend.status?.toLowerCase()}`}>
                      {agend.status}
                    </span>
                  </td>
                  <td>{formatarData(agend.data)}</td>
                  <td>{agend.hora}</td>
                  <td>{agend.tipoAtendimento}</td>
                  <td>🐾 {agend.Pet?.nome}</td>
                  <td>👤 {agend.Cliente?.nome}</td>
                  <td className="table-actions">
                    <StatusMenu
                      currentStatus={agend.status}
                      onStatusChange={handleStatusChange}
                      agendamentoId={agend.id}
                    />
                    <button
                      className="btn-icon btn-photo-small"
                      onClick={() => handlePhotoButtonClick(agend.id)}
                      title="Adicionar fotos"
                    >
                      📸
                    </button>
                    <button
                      className="btn-icon btn-edit"
                      title="Editar"
                      onClick={() => handleEdit(agend)}
                    >
                      ✏️
                    </button>
                    <button
                      className="btn-icon btn-delete"
                      title="Deletar"
                      onClick={() => handleDelete(agend.id)}
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ConfirmModal {...confirm} />
    </div>
  )
}
