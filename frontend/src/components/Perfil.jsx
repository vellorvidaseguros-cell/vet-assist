import { useState, useEffect } from 'react'
import axios from 'axios'
import BuscaVeiculo from './BuscaVeiculo'
import PricingModal from './PricingModal'
import WhiteLabelModal from './WhiteLabelModal'
import './Perfil.css'

export default function Perfil() {
  const [perfil, setPerfil] = useState(null)
  const [veiculo, setVeiculo] = useState(null)
  const [custoKm, setCustoKm] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [veiculoMode, setVeiculoMode] = useState(false)
  const [pricingModalOpen, setPricingModalOpen] = useState(false)
  const [whiteLabelModalOpen, setWhiteLabelModalOpen] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const veterinarioId = 1 // Será obtido do localStorage ou token

  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    cpf: '',
    crmv: '',
    nomeClinica: '',
    especialidade: '',
    endereco: '',
    cidade: '',
    estado: '',
    dataNascimento: '',
    genero: ''
  })

  const [veiculoForm, setVeiculoForm] = useState({
    placa: '',
    marca: '',
    modelo: '',
    ano: '',
    combustivel: 'Gasolina',
    kmAtual: '',
    consumoMedio: '',
    valorSeguroMensal: '',
    custoManutencaoEstimado: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [perfilRes, veiculoRes] = await Promise.all([
        axios.get(`/api/perfil/${veterinarioId}`),
        axios.get(`/api/veiculos/${veterinarioId}`)
      ])

      if (perfilRes.data.sucesso) {
        setPerfil(perfilRes.data.data)
        setFormData(perfilRes.data.data)
      }

      if (veiculoRes.data.sucesso && veiculoRes.data.data) {
        setVeiculo(veiculoRes.data.data)
        setVeiculoForm(veiculoRes.data.data)
        // Buscar custo do KM
        if (veiculoRes.data.data.id) {
          const custoRes = await axios.get(`/api/veiculos/${veiculoRes.data.data.id}/custo-km`)
          if (custoRes.data.sucesso) {
            setCustoKm(custoRes.data.data)
          }
        }
      }
    } catch (err) {
      setError('Erro ao carregar dados do perfil')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSavePerfil = async (e) => {
    e.preventDefault()
    try {
      const response = await axios.put(`/api/perfil/${veterinarioId}`, formData)
      if (response.data.sucesso) {
        setPerfil(response.data.data)
        setEditMode(false)
        setSuccess('Perfil atualizado com sucesso!')
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch (err) {
      setError(err.response?.data?.erro || 'Erro ao salvar perfil')
    }
  }

  const handleSaveVeiculo = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        ...veiculoForm,
        veterinarioId
      }

      let response
      if (veiculo) {
        response = await axios.put(`/api/veiculos/${veiculo.id}`, payload)
      } else {
        response = await axios.post('/api/veiculos', payload)
      }

      if (response.data.sucesso) {
        setVeiculo(response.data.data)
        setVeiculoMode(false)
        setSuccess('Veículo salvo com sucesso!')
        setTimeout(() => setSuccess(''), 3000)
        // Atualizar custo do KM
        if (response.data.data.id) {
          const custoRes = await axios.get(`/api/veiculos/${response.data.data.id}/custo-km`)
          if (custoRes.data.sucesso) {
            setCustoKm(custoRes.data.data)
          }
        }
      }
    } catch (err) {
      setError(err.response?.data?.erro || 'Erro ao salvar veículo')
    }
  }

  const handleVeiculoDataReceived = (dados) => {
    setVeiculoForm(prevForm => ({
      ...prevForm,
      placa: dados.placa || prevForm.placa,
      marca: dados.marca || prevForm.marca,
      modelo: dados.modelo || prevForm.modelo,
      ano: dados.ano || prevForm.ano,
      combustivel: dados.combustivel || prevForm.combustivel,
      consumoMedio: dados.consumoMedio || prevForm.consumoMedio,
      custoManutencaoEstimado: dados.custoManutencaoEstimado || prevForm.custoManutencaoEstimado
    }))
  }

  if (loading) return <div className="loading">Carregando...</div>

  return (
    <div className="perfil-container">
      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError('')}>×</button>
        </div>
      )}

      {success && <div className="success-message">{success}</div>}

      <div className="perfil-content">
        {/* Seção de Dados Pessoais */}
        <div className="perfil-card">
          <div className="card-header">
            <h2>👤 Dados Pessoais</h2>
            {!editMode && (
              <button className="btn-edit" onClick={() => setEditMode(true)}>
                ✏️ Editar
              </button>
            )}
          </div>

          {editMode ? (
            <form className="perfil-form" onSubmit={handleSavePerfil}>
              <div className="form-row">
                <div className="form-group">
                  <label>Nome Completo *</label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Telefone</label>
                  <input
                    type="tel"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>CPF</label>
                  <input
                    type="text"
                    value={formData.cpf}
                    onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>CRMV *</label>
                  <input
                    type="text"
                    value={formData.crmv}
                    onChange={(e) => setFormData({ ...formData, crmv: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Especialidade</label>
                  <input
                    type="text"
                    value={formData.especialidade}
                    onChange={(e) => setFormData({ ...formData, especialidade: e.target.value })}
                    placeholder="Ex: Clínica Geral, Cirurgia, etc"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Nome da Clínica</label>
                  <input
                    type="text"
                    value={formData.nomeClinica}
                    onChange={(e) => setFormData({ ...formData, nomeClinica: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Data de Nascimento</label>
                  <input
                    type="date"
                    value={formData.dataNascimento?.split('T')[0] || ''}
                    onChange={(e) => setFormData({ ...formData, dataNascimento: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Endereço</label>
                  <input
                    type="text"
                    value={formData.endereco}
                    onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Cidade</label>
                  <input
                    type="text"
                    value={formData.cidade}
                    onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Estado</label>
                  <input
                    type="text"
                    maxLength="2"
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary">Salvar Alterações</button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setEditMode(false)
                    setFormData(perfil)
                  }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <div className="perfil-info">
              <div className="info-row">
                <div className="info-item">
                  <span className="label">Nome:</span>
                  <span className="value">{perfil?.nome}</span>
                </div>
                <div className="info-item">
                  <span className="label">Email:</span>
                  <span className="value">{perfil?.email}</span>
                </div>
              </div>

              <div className="info-row">
                <div className="info-item">
                  <span className="label">CRMV:</span>
                  <span className="value">{perfil?.crmv}</span>
                </div>
                <div className="info-item">
                  <span className="label">Especialidade:</span>
                  <span className="value">{perfil?.especialidade || 'Não informado'}</span>
                </div>
              </div>

              <div className="info-row">
                <div className="info-item">
                  <span className="label">Clínica:</span>
                  <span className="value">{perfil?.nomeClinica || 'Não informado'}</span>
                </div>
                <div className="info-item">
                  <span className="label">Telefone:</span>
                  <span className="value">{perfil?.telefone}</span>
                </div>
              </div>

              <div className="info-row">
                <div className="info-item">
                  <span className="label">Cidade/Estado:</span>
                  <span className="value">{perfil?.cidade}/{perfil?.estado}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Seção de Veículo */}
        <div className="perfil-card">
          <div className="card-header">
            <h2>🚗 Informações do Veículo</h2>
            {!veiculoMode && (
              <button className="btn-edit" onClick={() => setVeiculoMode(true)}>
                ✏️ {veiculo ? 'Editar' : 'Adicionar'}
              </button>
            )}
          </div>

          {veiculoMode ? (
            <form className="perfil-form" onSubmit={handleSaveVeiculo}>
              <BuscaVeiculo onDataReceived={handleVeiculoDataReceived} isEditing={veiculoMode} />
              <div className="form-row">
                <div className="form-group">
                  <label>Marca</label>
                  <input
                    type="text"
                    value={veiculoForm.marca}
                    onChange={(e) => setVeiculoForm({ ...veiculoForm, marca: e.target.value })}
                    placeholder="Ex: Toyota, Fiat"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Modelo</label>
                  <input
                    type="text"
                    value={veiculoForm.modelo}
                    onChange={(e) => setVeiculoForm({ ...veiculoForm, modelo: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Ano</label>
                  <input
                    type="number"
                    value={veiculoForm.ano}
                    onChange={(e) => setVeiculoForm({ ...veiculoForm, ano: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Combustível</label>
                  <select
                    value={veiculoForm.combustivel}
                    onChange={(e) => setVeiculoForm({ ...veiculoForm, combustivel: e.target.value })}
                  >
                    <option value="Gasolina">Gasolina</option>
                    <option value="Diesel">Diesel</option>
                    <option value="Etanol">Etanol</option>
                    <option value="GNV">GNV</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>KM Atual</label>
                  <input
                    type="number"
                    value={veiculoForm.kmAtual}
                    onChange={(e) => setVeiculoForm({ ...veiculoForm, kmAtual: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Consumo Médio (KM/L)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={veiculoForm.consumoMedio}
                    onChange={(e) => setVeiculoForm({ ...veiculoForm, consumoMedio: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Seguro Mensal (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={veiculoForm.valorSeguroMensal}
                    onChange={(e) => setVeiculoForm({ ...veiculoForm, valorSeguroMensal: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Custo Manutenção Estimado (R$/mês)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={veiculoForm.custoManutencaoEstimado}
                    onChange={(e) => setVeiculoForm({ ...veiculoForm, custoManutencaoEstimado: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary">Salvar Veículo</button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setVeiculoMode(false)
                    setVeiculoForm(veiculo || {})
                  }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          ) : veiculo ? (
            <div className="veiculo-info">
              <div className="info-row">
                <div className="info-item">
                  <span className="label">Placa:</span>
                  <span className="value">{veiculo.placa}</span>
                </div>
                <div className="info-item">
                  <span className="label">Marca/Modelo:</span>
                  <span className="value">{veiculo.marca} {veiculo.modelo} ({veiculo.ano})</span>
                </div>
              </div>

              <div className="info-row">
                <div className="info-item">
                  <span className="label">Combustível:</span>
                  <span className="value">{veiculo.combustivel}</span>
                </div>
                <div className="info-item">
                  <span className="label">Consumo Médio:</span>
                  <span className="value">{veiculo.consumoMedio} KM/L</span>
                </div>
              </div>

              {custoKm && (
                <div className="custo-km-card">
                  <h3>💰 Análise de Custos</h3>
                  <div className="custo-row">
                    <div className="custo-item">
                      <span className="label">Custo/KM:</span>
                      <span className="value">R$ {custoKm.custoKm}</span>
                    </div>
                    <div className="custo-item">
                      <span className="label">Custo Mensal:</span>
                      <span className="value">R$ {custoKm.totalCustoMensal?.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="custo-breakdown">
                    <p>
                      <strong>Combustível:</strong> R$ {custoKm.custoCombuivel?.toFixed(2)} |{' '}
                      <strong>Seguro:</strong> R$ {custoKm.custoSeguroMensal?.toFixed(2)} |{' '}
                      <strong>Manutenção:</strong> R$ {custoKm.custoManutencaoMensal?.toFixed(2)} |{' '}
                      <strong>Depreciação:</strong> R$ {custoKm.custoDepreciacaoMensal?.toFixed(2)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="empty-message">Nenhum veículo cadastrado</p>
          )}
        </div>

        {/* Seção de Tabela de Preços */}
        <div className="perfil-card">
          <div className="card-header">
            <h2>💰 Tabela de Preços</h2>
          </div>
          <div className="card-content">
            <p className="card-description">Gerencie os valores dos seus serviços e produtos de forma centralizada.</p>
            <button
              className="btn-manage-pricing"
              onClick={() => setPricingModalOpen(true)}
            >
              ⚙️ Gerenciar Tabela de Preços
            </button>
          </div>
        </div>

        {/* Seção de White Label */}
        <div className="perfil-card">
          <div className="card-header">
            <h2>⚙️ Configurar Clínica</h2>
          </div>
          <div className="card-content">
            <p className="card-description">Personalize o nome, logomarca e informações da sua clínica para documentos e relatórios.</p>
            <button
              className="btn-manage-pricing"
              onClick={() => setWhiteLabelModalOpen(true)}
            >
              🏥 Configurar Identidade da Clínica
            </button>
          </div>
        </div>
      </div>

      {/* Pricing Modal */}
      <PricingModal
        isOpen={pricingModalOpen}
        onClose={() => setPricingModalOpen(false)}
      />

      {/* White Label Modal */}
      <WhiteLabelModal
        isOpen={whiteLabelModalOpen}
        onClose={() => setWhiteLabelModalOpen(false)}
      />
    </div>
  )
}
