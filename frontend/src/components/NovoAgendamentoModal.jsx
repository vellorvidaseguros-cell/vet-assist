import { useState, useEffect } from 'react'
import axios from 'axios'
import { HORARIOS } from '../utils/horariosDisponiveis'
import './NovoAgendamentoModal.css'

const AGENDAMENTO_VAZIO = {
  clienteId: '',
  petId: '',
  data: '',
  hora: '',
  tipoAtendimento: '',
  descricao: '',
  valor: '',
  status: 'Pendente'
}

const TIPOS_ATENDIMENTO = [
  'Consulta Geral',
  'Vacinação',
  'Cirurgia',
  'Banho e Tosa',
  'Limpeza de Dentes',
  'Ultrassom',
  'Radiografia',
  'Exame Laboratorial',
  'Retorno',
  'Emergência',
  'Outro'
]

export default function NovoAgendamentoModal({ onClose, onSuccess }) {
  const [agendamentoForm, setAgendamentoForm] = useState(AGENDAMENTO_VAZIO)
  const [clientes, setClientes] = useState([])
  const [pets, setPets] = useState([])
  const [petsFiltrados, setPetsFiltrados] = useState([])
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [tabelaPrecos, setTabelaPrecos] = useState({})

  useEffect(() => {
    carregarDados()
  }, [])

  useEffect(() => {
    // Filtrar pets baseado no cliente selecionado
    if (agendamentoForm.clienteId) {
      const petsDo = pets.filter(p => p.clienteId === parseInt(agendamentoForm.clienteId))
      setPetsFiltrados(petsDo)
      // Limpar pet selecionado se não estiver na lista filtrada
      if (agendamentoForm.petId && !petsDo.find(p => p.id === parseInt(agendamentoForm.petId))) {
        setAgendamentoForm(prev => ({ ...prev, petId: '' }))
      }
    } else {
      setPetsFiltrados([])
    }
  }, [agendamentoForm.clienteId, pets])

  const carregarDados = async () => {
    try {
      setCarregando(true)
      const [clientesRes, petsRes, precosRes] = await Promise.all([
        axios.get('/api/clientes'),
        axios.get('/api/pets'),
        axios.get('/api/perfil/tabela-precos')
      ])

      if (clientesRes.data.sucesso) setClientes(clientesRes.data.data || [])
      if (petsRes.data.sucesso) setPets(petsRes.data.data || [])
      if (precosRes.data.sucesso) setTabelaPrecos(precosRes.data.data || {})
    } catch (err) {
      setErro('Erro ao carregar dados')
      console.error(err)
    } finally {
      setCarregando(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target

    // Auto-preencher valor ao selecionar tipo de atendimento
    if (name === 'tipoAtendimento' && value && tabelaPrecos[value] !== undefined) {
      setAgendamentoForm(prev => ({
        ...prev,
        [name]: value,
        valor: parseFloat(tabelaPrecos[value]).toFixed(2)
      }))
      return
    }

    setAgendamentoForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSalvar = async () => {
    // Validações
    if (!agendamentoForm.clienteId.trim()) {
      setErro('Cliente é obrigatório')
      return
    }
    if (!agendamentoForm.petId.trim()) {
      setErro('Pet é obrigatório')
      return
    }
    if (!agendamentoForm.data.trim()) {
      setErro('Data é obrigatória')
      return
    }
    if (!agendamentoForm.hora.trim()) {
      setErro('Hora é obrigatória')
      return
    }
    if (!agendamentoForm.tipoAtendimento.trim()) {
      setErro('Tipo de atendimento é obrigatório')
      return
    }
    if (!agendamentoForm.valor || parseFloat(agendamentoForm.valor) <= 0) {
      setErro('Valor deve ser maior que zero')
      return
    }

    setSalvando(true)
    setErro('')

    try {
      const response = await axios.post('/api/agendamentos', {
        ...agendamentoForm,
        clienteId: parseInt(agendamentoForm.clienteId),
        petId: parseInt(agendamentoForm.petId),
        valor: parseFloat(agendamentoForm.valor)
      })

      if (response.data.sucesso) {
        onSuccess()
        onClose()
      } else {
        setErro(response.data.erro || 'Erro ao criar agendamento')
      }
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao salvar agendamento. Tente novamente.')
      console.error(err)
    } finally {
      setSalvando(false)
    }
  }

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  if (carregando) {
    return (
      <div className="nam-overlay" onClick={handleOverlayClick}>
        <div className="nam-modal">
          <div className="nam-header">
            <h2>📅 Novo Agendamento</h2>
          </div>
          <div className="nam-body">
            <p style={{ textAlign: 'center', color: '#8e8e93' }}>Carregando dados...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="nam-overlay" onClick={handleOverlayClick}>
      <div className="nam-modal">
        {/* HEADER */}
        <div className="nam-header">
          <h2>📅 Novo Agendamento</h2>
        </div>

        {/* BODY */}
        <div className="nam-body">
          {erro && <div className="nam-error">⚠️ {erro}</div>}

          {/* CLIENTE E PET */}
          <div className="nam-section">
            <h3 className="nam-section-title">👤 Cliente e Pet</h3>

            <div className="nam-row">
              <div className="nam-group">
                <label>Cliente *</label>
                <select
                  name="clienteId"
                  value={agendamentoForm.clienteId}
                  onChange={handleInputChange}
                >
                  <option value="">Selecione um cliente</option>
                  {clientes.map(cliente => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="nam-group">
                <label>Pet *</label>
                <select
                  name="petId"
                  value={agendamentoForm.petId}
                  onChange={handleInputChange}
                  disabled={!agendamentoForm.clienteId}
                >
                  <option value="">
                    {agendamentoForm.clienteId ? 'Selecione um pet' : 'Escolha um cliente primeiro'}
                  </option>
                  {petsFiltrados.map(pet => (
                    <option key={pet.id} value={pet.id}>
                      {pet.nome} ({pet.especie})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* DATA E HORA */}
          <div className="nam-section">
            <h3 className="nam-section-title">📆 Data e Hora</h3>

            <div className="nam-row">
              <div className="nam-group">
                <label>Data *</label>
                <input
                  type="date"
                  name="data"
                  value={agendamentoForm.data}
                  onChange={handleInputChange}
                />
              </div>

              <div className="nam-group">
                <label>Hora *</label>
                <select
                  name="hora"
                  value={agendamentoForm.hora}
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
          </div>

          {/* ATENDIMENTO */}
          <div className="nam-section">
            <h3 className="nam-section-title">🏥 Tipo de Atendimento</h3>

            <div className="nam-row single">
              <div className="nam-group">
                <label>Tipo de Atendimento *</label>
                <select
                  name="tipoAtendimento"
                  value={agendamentoForm.tipoAtendimento}
                  onChange={handleInputChange}
                >
                  <option value="">Selecione um tipo</option>
                  {TIPOS_ATENDIMENTO.map(tipo => (
                    <option key={tipo} value={tipo}>
                      {tipo}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="nam-row single">
              <div className="nam-group">
                <label>Descrição</label>
                <textarea
                  name="descricao"
                  placeholder="Descrição do atendimento (opcional)"
                  value={agendamentoForm.descricao}
                  onChange={handleInputChange}
                  rows="3"
                />
              </div>
            </div>
          </div>

          {/* VALOR */}
          <div className="nam-section">
            <h3 className="nam-section-title">💰 Valor</h3>

            <div className="nam-row single">
              <div className="nam-group">
                <label>Valor da Consulta *</label>
                <input
                  type="number"
                  name="valor"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  value={agendamentoForm.valor}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="nam-footer">
          <button className="nam-btn-cancelar" onClick={onClose} disabled={salvando}>
            Cancelar
          </button>
          <button
            className="nam-btn-salvar"
            onClick={handleSalvar}
            disabled={salvando}
          >
            {salvando ? 'Salvando...' : '✓ Criar Agendamento'}
          </button>
        </div>
      </div>
    </div>
  )
}
