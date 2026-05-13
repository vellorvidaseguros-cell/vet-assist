import { useState, useEffect } from 'react'
import axios from 'axios'
import './PricingModal.css'

const DEFAULT_SERVICES = [
  { id: 1, nome: 'Consulta', padrao: 150 },
  { id: 2, nome: 'Vacinação', padrao: 80 },
  { id: 3, nome: 'Banho e Tosa', padrao: 120 },
  { id: 4, nome: 'Cirurgia', padrao: 500 },
  { id: 5, nome: 'Ultrassom', padrao: 200 },
  { id: 6, nome: 'Radiografia', padrao: 180 },
  { id: 7, nome: 'Retorno', padrao: 100 },
  { id: 8, nome: 'Atendimento Emergencial', padrao: 300 }
]

// Converte string de input ("150,00" ou "150.00") para número
const parseInputValue = (str) => {
  if (!str) return null
  // Aceita tanto "," quanto "." como separador decimal
  const clean = str.replace(/[^0-9,\.]/g, '').replace(',', '.')
  const num = parseFloat(clean)
  return isNaN(num) ? null : num
}

// Formata número para exibição BR (150 → "150,00")
const formatBR = (value) => {
  if (value == null || value === '') return ''
  const num = typeof value === 'string' ? parseInputValue(value) : value
  if (num == null) return ''
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function PricingModal({ isOpen, onClose }) {
  const [services, setServices] = useState([...DEFAULT_SERVICES])
  const [customValues, setCustomValues] = useState({})     // numérico salvo
  const [inputValues, setInputValues] = useState({})        // texto temporário do input
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [newService, setNewService] = useState({ nome: '', valor: '' })
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingService, setEditingService] = useState(null) // {id, nome}

  useEffect(() => {
    if (isOpen) {
      fetchPricingData()
    }
  }, [isOpen])

  const fetchPricingData = async () => {
    try {
      setLoading(true)
      const res = await axios.get('/api/perfil')
      if (res.data.sucesso && res.data.data?.tabelaPrecos) {
        const vals = res.data.data.tabelaPrecos
        setCustomValues(vals)
        // Inicializar inputValues formatado
        const initInputs = {}
        Object.entries(vals).forEach(([k, v]) => {
          initInputs[k] = formatBR(v)
        })
        setInputValues(initInputs)
      }
    } catch (err) {
      console.error('Erro ao carregar preços:', err)
      setCustomValues({})
      setInputValues({})
    } finally {
      setLoading(false)
    }
  }

  // Enquanto digita: só atualiza o texto visual
  const handleInputChange = (serviceId, text) => {
    setInputValues(prev => ({ ...prev, [serviceId]: text }))
  }

  // Ao sair do campo: converte para número e formata
  const handleInputBlur = (serviceId) => {
    const raw = inputValues[serviceId] ?? ''
    const num = parseInputValue(raw)
    if (num != null) {
      setCustomValues(prev => ({ ...prev, [serviceId]: num }))
      setInputValues(prev => ({ ...prev, [serviceId]: formatBR(num) }))
    } else {
      // Campo vazio → remove customização
      setCustomValues(prev => { const n = { ...prev }; delete n[serviceId]; return n })
      setInputValues(prev => ({ ...prev, [serviceId]: '' }))
    }
  }

  // Ao focar: mostra só o número sem formatação para facilitar edição
  const handleInputFocus = (serviceId) => {
    const num = customValues[serviceId]
    if (num != null) {
      setInputValues(prev => ({ ...prev, [serviceId]: String(num) }))
    }
  }

  const handleAddService = () => {
    if (!newService.nome.trim() || !newService.valor) {
      setError('Preencha o nome do serviço e o valor.')
      return
    }
    const num = parseInputValue(newService.valor)
    if (!num) { setError('Valor inválido.'); return }

    const newId = Math.max(...services.map(s => s.id), 0) + 1
    const serviceToAdd = { id: newId, nome: newService.nome.trim(), padrao: num }

    setServices(prev => [...prev, serviceToAdd])
    setCustomValues(prev => ({ ...prev, [newId]: num }))
    setInputValues(prev => ({ ...prev, [newId]: formatBR(num) }))
    setNewService({ nome: '', valor: '' })
    setShowAddForm(false)
    setError('')
  }

  const handleRemoveService = (serviceId) => {
    if (window.confirm('Tem certeza que deseja remover este serviço?')) {
      setServices(prev => prev.filter(s => s.id !== serviceId))
      const newCV = { ...customValues }; delete newCV[serviceId]
      const newIV = { ...inputValues };  delete newIV[serviceId]
      setCustomValues(newCV)
      setInputValues(newIV)
    }
  }

  const handleEditService = (serviceId) => {
    const service = services.find(s => s.id === serviceId)
    if (!service) return
    const novoNome = window.prompt('Editar nome do serviço:', service.nome)
    if (novoNome === null) return // usuário cancelou
    const nomeTrimmed = novoNome.trim()
    if (!nomeTrimmed) {
      setError('Nome do serviço não pode ser vazio.')
      return
    }
    setServices(prev => prev.map(s =>
      s.id === serviceId ? { ...s, nome: nomeTrimmed } : s
    ))
    setError('')
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError('')
      setSuccess('')

      const res = await axios.put('/api/perfil', {
        tabelaPrecos: customValues
      })

      if (res.data.sucesso) {
        setSuccess('Tabela de preços atualizada com sucesso!')
        setTimeout(() => {
          setSuccess('')
          onClose()
        }, 1500)
      }
    } catch (err) {
      setError('Erro ao salvar preços. Tente novamente.')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const getPrice = (serviceId) => {
    return customValues[serviceId] ?? services.find(s => s.id === serviceId)?.padrao ?? 0
  }

  if (!isOpen) return null

  return (
    <div className="pricing-modal-overlay">
      <div className="pricing-modal">
        {/* Header */}
        <div className="modal-header">
          <h2>💰 Tabela de Preços</h2>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>

        {/* Messages */}
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        {/* Loading State */}
        {loading ? (
          <div className="modal-body">
            <p className="loading">Carregando...</p>
          </div>
        ) : (
          <>
            {/* Services List */}
            <div className="modal-body">
              <div className="services-list">
                {services.map(service => (
                  <div key={service.id} className="service-item">
                    <div className="service-info">
                      <div className="service-name">{service.nome}</div>
                      <div className="service-default">
                        Padrão: R$ {formatBR(service.padrao)}
                      </div>
                    </div>

                    <div className="service-input-group">
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="0,00"
                        value={inputValues[service.id] ?? ''}
                        onChange={(e) => handleInputChange(service.id, e.target.value)}
                        onFocus={() => handleInputFocus(service.id)}
                        onBlur={() => handleInputBlur(service.id)}
                        className="price-input"
                      />
                      <div className="service-actions">
                        <button
                          className="btn-action btn-edit"
                          onClick={() => handleEditService(service.id)}
                          title="Editar serviço"
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-action btn-delete"
                          onClick={() => handleRemoveService(service.id)}
                          title="Remover serviço"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    <div className="service-final">
                      R$ {formatBR(getPrice(service.id))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Add New Service Form */}
              {showAddForm && (
                <div className="add-service-form">
                  <h3>Adicionar Novo Serviço</h3>
                  <div className="form-group">
                    <label>Nome do Serviço/Produto</label>
                    <input
                      type="text"
                      placeholder="Ex: Limpeza de Ouvido"
                      value={newService.nome}
                      onChange={(e) => setNewService({ ...newService, nome: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Valor (R$)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0,00"
                      value={newService.valor}
                      onChange={(e) => setNewService({ ...newService, valor: e.target.value })}
                    />
                  </div>

                  <div className="form-actions">
                    <button
                      className="btn-confirm"
                      onClick={handleAddService}
                    >
                      ✓ Adicionar
                    </button>
                    <button
                      className="btn-cancel"
                      onClick={() => {
                        setShowAddForm(false)
                        setNewService({ nome: '', valor: '' })
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Add Button (when form is hidden) */}
              {!showAddForm && (
                <button
                  className="btn-add-service"
                  onClick={() => setShowAddForm(true)}
                >
                  + Adicionar Serviço
                </button>
              )}
            </div>

            {/* Footer Actions */}
            <div className="modal-footer">
              <button
                className="btn-cancel-main"
                onClick={onClose}
              >
                Cancelar
              </button>
              <button
                className="btn-save-main"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Salvando...' : '💾 Salvar Tabela'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
