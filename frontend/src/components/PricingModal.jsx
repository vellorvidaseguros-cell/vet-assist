import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import axios from 'axios'
import { Pencil, Trash2 } from 'lucide-react'
import ConfirmModal from './ConfirmModal'
import PromptModal from './PromptModal'
import { useSwipeToClose } from '../hooks/useSwipeToClose'
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
  const { ref: swipeRef, style: swipeStyle } = useSwipeToClose(onClose)
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
  const [confirm, setConfirm] = useState({ open: false })
  const [promptData, setPromptData] = useState({ open: false, initialValue: '', title: '' })
  // Precificação: hora técnica + durações estimadas por serviço (guardadas dentro de precificacao,
  // para não alterar a estrutura de tabelaPrecos, que é lida como número em vários lugares)
  const [precificacao, setPrecificacao] = useState(null)
  const [duracoes, setDuracoes] = useState({}) // { nomeServico: minutos }

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
      if (res.data.sucesso && res.data.data?.precificacao) {
        setPrecificacao(res.data.data.precificacao)
        setDuracoes(res.data.data.precificacao.duracoesServicos || {})
      }
    } catch (err) {
      console.error('Erro ao carregar preços:', err)
      setCustomValues({})
      setInputValues({})
    } finally {
      setLoading(false)
    }
  }

  const horaTecnica = parseFloat(precificacao?.horaTecnica) || 0

  // Custo mínimo recomendado = (duração em horas) × hora técnica
  const custoMinimo = (nomeServico) => {
    const min = parseFloat(duracoes[nomeServico]) || 0
    if (horaTecnica <= 0 || min <= 0) return null
    return (min / 60) * horaTecnica
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

  // Novo serviço: mesmo comportamento de máscara BR dos demais campos
  const handleNewValueFocus = () => {
    const num = parseInputValue(newService.valor)
    if (num != null) {
      setNewService(prev => ({ ...prev, valor: String(num) }))
    }
  }

  const handleNewValueBlur = () => {
    const num = parseInputValue(newService.valor)
    setNewService(prev => ({ ...prev, valor: num != null ? formatBR(num) : '' }))
  }

  const handleAddService = () => {
    if (!newService.nome.trim() || !newService.valor) {
      setError('Preencha o nome do serviço e o valor.')
      return
    }
    const num = parseInputValue(newService.valor)
    if (!num) { setError('Valor inválido.'); return }

    const nomeKey = newService.nome.trim()
    // Usa o próprio nome como ID para garantir que a chave salva é o nome
    const serviceToAdd = { id: nomeKey, nome: nomeKey, padrao: num }

    setServices(prev => [...prev, serviceToAdd])
    setCustomValues(prev => ({ ...prev, [nomeKey]: num }))
    setInputValues(prev => ({ ...prev, [nomeKey]: formatBR(num) }))
    setNewService({ nome: '', valor: '' })
    setShowAddForm(false)
    setError('')
  }

  const handleRemoveService = (serviceId) => {
    setConfirm({
      open: true,
      title: 'Remover Serviço',
      message: 'Tem certeza que deseja remover este serviço?',
      confirmText: 'Remover',
      cancelText: 'Cancelar',
      confirmColor: 'danger',
      onConfirm: () => {
        setServices(prev => prev.filter(s => s.id !== serviceId))
        const newCV = { ...customValues }; delete newCV[serviceId]
        const newIV = { ...inputValues };  delete newIV[serviceId]
        setCustomValues(newCV)
        setInputValues(newIV)
        setConfirm({ open: false })
      },
      onCancel: () => setConfirm({ open: false })
    })
  }

  const handleEditService = (serviceId) => {
    const service = services.find(s => s.id === serviceId)
    if (!service) return
    setPromptData({
      open: true,
      title: 'Editar Nome do Serviço',
      message: '',
      initialValue: service.nome,
      confirmText: 'OK',
      cancelText: 'Cancelar',
      onConfirm: (novoNome) => {
        const nomeTrimmed = novoNome.trim()
        if (!nomeTrimmed) {
          setError('Nome do serviço não pode ser vazio.')
          return
        }
        setServices(prev => prev.map(s =>
          s.id === serviceId ? { ...s, nome: nomeTrimmed } : s
        ))
        setError('')
        setPromptData({ open: false })
      },
      onCancel: () => setPromptData({ open: false })
    })
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError('')
      setSuccess('')

      // Constrói objeto com nome do serviço como chave (nunca ID numérico)
      const tabelaFinal = {}
      services.forEach(s => {
        const val = customValues[s.nome] !== undefined ? customValues[s.nome]
                  : customValues[s.id] !== undefined ? customValues[s.id]
                  : null
        if (val != null && val > 0) {
          tabelaFinal[s.nome] = val
        }
      })

      const payload = { tabelaPrecos: tabelaFinal }

      // Se há hora técnica configurada, persistir também as durações estimadas
      // (guardadas dentro de precificacao, sem tocar em tabelaPrecos)
      if (precificacao) {
        const duracoesLimpo = {}
        Object.entries(duracoes).forEach(([k, v]) => {
          const n = parseFloat(v)
          if (n > 0) duracoesLimpo[k] = n
        })
        payload.precificacao = { ...precificacao, duracoesServicos: duracoesLimpo }
      }

      const res = await axios.put('/api/perfil', payload)

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

  return createPortal(
    <div className="pricing-modal-overlay">
      <div className="pricing-modal" ref={swipeRef} style={swipeStyle}>
        {/* Header */}
        <div className="modal-header">
          <h2>Tabela de Preços</h2>
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
              {horaTecnica > 0 ? (
                <p className="pricing-dica">
                  Informe a <strong>duração</strong> (⏱️) de cada serviço para ver o <strong>preço mínimo</strong> que cobre seu custo (hora técnica: R$ {formatBR(horaTecnica)}).
                </p>
              ) : (
                <p className="pricing-dica pricing-dica-neutra">
                  Configure sua <strong>Hora Técnica</strong> no card "Precificação" do Perfil para ver o preço mínimo recomendado de cada serviço.
                </p>
              )}
              <div className="services-list">
                {services.map(service => {
                  const minimo = custoMinimo(service.nome)
                  const precoAtual = getPrice(service.id)
                  const abaixoDoCusto = minimo != null && precoAtual > 0 && precoAtual < minimo
                  return (
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
                        className={`price-input ${abaixoDoCusto ? 'price-input-alerta' : ''}`}
                      />
                      <div className="service-actions">
                        <button
                          className="btn-action btn-edit"
                          onClick={() => handleEditService(service.id)}
                          title="Editar serviço"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          className="btn-action btn-delete"
                          onClick={() => handleRemoveService(service.id)}
                          title="Remover serviço"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="service-final">
                      R$ {formatBR(precoAtual)}
                    </div>

                    {/* Preço mínimo recomendado (só aparece se hora técnica configurada) */}
                    {horaTecnica > 0 && (
                      <div className="service-precificacao">
                        <label className="service-duracao">
                          ⏱️
                          <input
                            type="number"
                            placeholder="min"
                            value={duracoes[service.nome] ?? ''}
                            onChange={(e) => setDuracoes(prev => ({ ...prev, [service.nome]: e.target.value }))}
                            title="Duração estimada do serviço (minutos)"
                          />
                          min
                        </label>
                        {minimo != null && (
                          <span className={`service-minimo ${abaixoDoCusto ? 'alerta' : 'ok'}`}>
                            {abaixoDoCusto ? 'abaixo do custo' : 'acima do mínimo'}: R$ {formatBR(minimo)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  )
                })}
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
                      type="text"
                      inputMode="decimal"
                      placeholder="0,00"
                      value={newService.valor}
                      onChange={(e) => setNewService({ ...newService, valor: e.target.value })}
                      onFocus={handleNewValueFocus}
                      onBlur={handleNewValueBlur}
                    />
                  </div>

                  <div className="form-actions">
                    <button
                      className="btn-confirm"
                      onClick={handleAddService}
                    >
                      Adicionar
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
                {saving ? 'Salvando...' : 'Salvar Tabela'}
              </button>
            </div>
          </>
        )}
      </div>
      <ConfirmModal {...confirm} />
      <PromptModal {...promptData} />
    </div>,
    document.body
  )
}
