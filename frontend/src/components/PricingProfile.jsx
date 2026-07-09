import { useState, useEffect } from 'react'
import axios from 'axios'
import './PricingProfile.css'

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

export default function PricingProfile() {
  const [services, setServices] = useState(DEFAULT_SERVICES)
  const [customValues, setCustomValues] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchPricingData()
  }, [])

  const fetchPricingData = async () => {
    try {
      setLoading(true)
      const res = await axios.get('/api/perfil')
      if (res.data.sucesso && res.data.data?.tabelaPrecos) {
        setCustomValues(res.data.data.tabelaPrecos)
      }
    } catch (err) {
      console.error('Erro ao carregar preços:', err)
      setCustomValues({})
    } finally {
      setLoading(false)
    }
  }

  const handleCustomValueChange = (serviceId, value) => {
    setCustomValues(prev => ({
      ...prev,
      [serviceId]: value ? parseFloat(value) : null
    }))
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
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch (err) {
      setError('Erro ao salvar preços. Tente novamente.')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const getPrice = (serviceId) => {
    return customValues[serviceId] || DEFAULT_SERVICES.find(s => s.id === serviceId)?.padrao || 0
  }

  if (loading) return <div className="loading">Carregando...</div>

  return (
    <div className="pricing-profile">
      <div className="pricing-header">
        <h2>Tabela de Preços</h2>
        <p>Configure o valor padrão dos atendimentos. Use a coluna "Valor Customizado" para sobrescrever.</p>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="pricing-table-container">
        <table className="pricing-table">
          <thead>
            <tr>
              <th>Tipo de Atendimento</th>
              <th>Valor Padrão</th>
              <th>Valor Customizado</th>
              <th>Valor Final</th>
            </tr>
          </thead>
          <tbody>
            {services.map(service => (
              <tr key={service.id}>
                <td className="service-name">
                  <strong>{service.nome}</strong>
                </td>
                <td className="default-price">
                  R$ {service.padrao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </td>
                <td className="custom-input">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="--"
                    value={customValues[service.id] ?? ''}
                    onChange={(e) => handleCustomValueChange(service.id, e.target.value)}
                    className="price-input"
                  />
                </td>
                <td className="final-price">
                  <strong className="highlight">
                    R$ {getPrice(service.id).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </strong>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pricing-actions">
        <button
          className="btn-save"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Salvando...' : 'Salvar Tabela de Preços'}
        </button>
      </div>

      <div className="pricing-info">
        <div className="info-box">
          <h4>ℹ️ Como funciona:</h4>
          <ul>
            <li>Os valores padrão são usados automaticamente em novos agendamentos</li>
            <li>Coloque um valor customizado para sobrescrever o padrão</li>
            <li>Deixe em branco para usar o valor padrão</li>
            <li>O valor será preenchido automaticamente no agendamento</li>
            <li>Você ainda pode ajustar manualmente no agendamento se necessário</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
