import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import axios from 'axios'
import BuscaVeiculo from './BuscaVeiculo'
import PricingModal from './PricingModal'
import WhiteLabelModal from './WhiteLabelModal'
import CompartilharAnimalModal from './CompartilharAnimalModal'
import EsqueceSenhaModal from './EsqueceSenhaModal'
import ExportarDadosModal from './ExportarDadosModal'
import PrecificacaoModal from './PrecificacaoModal'
import EstoqueInsumosModal from './EstoqueInsumosModal'
import DocumentosEmitidosModal from './DocumentosEmitidosModal'
import NotificacoesModal from './NotificacoesModal'
import MoneyInput from './MoneyInput'
import './Perfil.css'

export default function Perfil() {
  const navigate = useNavigate()
  const [perfil, setPerfil] = useState(null)
  const [veiculo, setVeiculo] = useState(null)
  const [custoKm, setCustoKm] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [veiculoMode, setVeiculoMode] = useState(false)
  const [pricingModalOpen, setPricingModalOpen] = useState(false)
  const [whiteLabelModalOpen, setWhiteLabelModalOpen] = useState(false)
  const [compartilharModalOpen, setCompartilharModalOpen] = useState(false)
  const [esqueceSenhaModalOpen, setEsqueceSenhaModalOpen] = useState(false)
  const [exportarModalOpen, setExportarModalOpen] = useState(false)
  const [precificacaoModalOpen, setPrecificacaoModalOpen] = useState(false)
  const [estoqueModalOpen, setEstoqueModalOpen] = useState(false)
  const [documentosModalOpen, setDocumentosModalOpen] = useState(false)
  const [notificacoesModalOpen, setNotificacoesModalOpen] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [dadosCobranca, setDadosCobranca] = useState('')
  const [salvandoCobranca, setSalvandoCobranca] = useState(false)
  const [meusPets, setMeusPets] = useState([])
  const [compartilhamentosFeitos, setCompartilhamentosFeitos] = useState([])
  const [expandedSections, setExpandedSections] = useState({})

  const toggleSection = (chave) => {
    setExpandedSections(prev => ({ ...prev, [chave]: !prev[chave] }))
  }

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
    kmMensal: '',
    consumoMedio: '',
    precoCombustivel: '',
    valorSeguroMensal: '',
    valorIPVAAnual: '',
    custoManutencaoEstimado: '',
    percentualUsoProfissional: 100
  })

  useEffect(() => {
    fetchData()
  }, [])

  // Rascunho do formulário de veículo: salva enquanto edita, para sobreviver a
  // recargas do PWA (iOS). Limpo ao salvar ou cancelar.
  useEffect(() => {
    if (veiculoMode) {
      try { localStorage.setItem('draft_veiculo', JSON.stringify(veiculoForm)) } catch (e) { /* quota */ }
    }
  }, [veiculoForm, veiculoMode])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [perfilRes, veiculoRes, petsRes] = await Promise.all([
        axios.get(`/api/perfil/${veterinarioId}`),
        axios.get(`/api/veiculos/${veterinarioId}`),
        axios.get('/api/pets')
      ])

      if (perfilRes.data.sucesso) {
        setPerfil(perfilRes.data.data)
        setFormData(perfilRes.data.data)
        setDadosCobranca(perfilRes.data.data.dadosCobranca || '')
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

      // Restaura rascunho não salvo do veículo (ex: app recarregou no meio da edição)
      try {
        const draft = localStorage.getItem('draft_veiculo')
        if (draft) {
          setVeiculoForm(JSON.parse(draft))
          setVeiculoMode(true)
        }
      } catch (e) { /* ignora rascunho inválido */ }

      if (petsRes.data.sucesso && Array.isArray(petsRes.data.data)) {
        setMeusPets(petsRes.data.data)
      }

      fetchCompartilhamentosFeitos()
    } catch (err) {
      setError('Erro ao carregar dados do perfil')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchCompartilhamentosFeitos = async () => {
    try {
      const res = await axios.get('/api/compartilhamento/meus')
      if (res.data.sucesso && Array.isArray(res.data.data)) {
        setCompartilhamentosFeitos(res.data.data)
      }
    } catch (err) {
      console.error('Erro ao buscar compartilhamentos feitos:', err)
    }
  }

  const handleRevogarCompartilhamento = async (comp) => {
    if (!window.confirm(`Remover o acesso ao animal "${comp.Pet?.nome || ''}"? O veterinário convidado deixará de ver o diário deste animal.`)) return
    try {
      await axios.delete(`/api/compartilhamento/animais/${comp.animalId}/compartilhamentos/${comp.id}`)
      setCompartilhamentosFeitos(prev => prev.filter(c => c.id !== comp.id))
    } catch (err) {
      setError('Erro ao revogar acesso')
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

  const handleSalvarDadosCobranca = async () => {
    try {
      setSalvandoCobranca(true)
      const response = await axios.put(`/api/perfil/${veterinarioId}`, { dadosCobranca })
      if (response.data.sucesso) {
        setPerfil(response.data.data)
        setSuccess('Dados de cobrança salvos com sucesso!')
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch (err) {
      setError(err.response?.data?.erro || 'Erro ao salvar dados de cobrança')
    } finally {
      setSalvandoCobranca(false)
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
        localStorage.removeItem('draft_veiculo') // rascunho consolidado
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

  const handleLogout = () => {
    if (window.confirm('Tem certeza que deseja sair?')) {
      localStorage.removeItem('token')
      localStorage.removeItem('veterinario')
      localStorage.removeItem('activeTab')
      navigate('/login')
    }
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
          <div className="card-header card-header-clicavel" onClick={() => toggleSection('dadosPessoais')}>
            <h2>Dados Pessoais</h2>
            <ChevronDown size={18} className={`card-chevron ${(expandedSections.dadosPessoais || editMode) ? 'aberto' : ''}`} />
          </div>

          {(expandedSections.dadosPessoais || editMode) && (
          <div className="card-content">
          {!editMode && (
            <button className="btn-edit" onClick={(e) => { e.stopPropagation(); setEditMode(true) }}>
              Editar
            </button>
          )}

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
          )}
        </div>

        {/* Seção de Veículo */}
        <div className="perfil-card">
          <div className="card-header card-header-clicavel" onClick={() => toggleSection('veiculo')}>
            <h2>Informações do Veículo</h2>
            <ChevronDown size={18} className={`card-chevron ${(expandedSections.veiculo || veiculoMode) ? 'aberto' : ''}`} />
          </div>

          {(expandedSections.veiculo || veiculoMode) && (
          <div className="card-content">
            {!veiculoMode && (
              <button className="btn-edit" onClick={(e) => { e.stopPropagation(); setVeiculoMode(true) }}>
                {veiculo ? 'Editar' : 'Adicionar'}
              </button>
            )}

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
                  <label>KM Atual (odômetro)</label>
                  <input
                    type="number"
                    value={veiculoForm.kmAtual}
                    onChange={(e) => setVeiculoForm({ ...veiculoForm, kmAtual: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>KM rodados por mês a trabalho</label>
                  <input
                    type="number"
                    placeholder="Ex: 1500"
                    value={veiculoForm.kmMensal}
                    onChange={(e) => setVeiculoForm({ ...veiculoForm, kmMensal: e.target.value })}
                  />
                  <small style={{ color: '#888', fontSize: '0.75rem' }}>
                    Base do cálculo de custo/km. Estime a média mensal de deslocamentos para atendimentos.
                  </small>
                </div>
                <div className="form-group">
                  <label>Uso profissional do veículo (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={veiculoForm.percentualUsoProfissional}
                    onChange={(e) => setVeiculoForm({ ...veiculoForm, percentualUsoProfissional: e.target.value })}
                  />
                  <small style={{ color: '#888', fontSize: '0.75rem' }}>
                    Se também usa o carro na vida pessoal, os custos fixos são rateados.
                  </small>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Consumo Médio (KM/L)</label>
                  <MoneyInput
                    placeholder="Ex: 10,5"
                    value={veiculoForm.consumoMedio}
                    onChangeValue={(v) => setVeiculoForm({ ...veiculoForm, consumoMedio: v ?? '' })}
                  />
                </div>
                <div className="form-group">
                  <label>Preço do Combustível (R$/L)</label>
                  <MoneyInput
                    placeholder="Vazio = média de mercado"
                    value={veiculoForm.precoCombustivel}
                    onChangeValue={(v) => setVeiculoForm({ ...veiculoForm, precoCombustivel: v ?? '' })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Seguro Mensal (R$)</label>
                  <MoneyInput
                    value={veiculoForm.valorSeguroMensal}
                    onChangeValue={(v) => setVeiculoForm({ ...veiculoForm, valorSeguroMensal: v ?? '' })}
                  />
                </div>
                <div className="form-group">
                  <label>IPVA Anual (R$)</label>
                  <MoneyInput
                    value={veiculoForm.valorIPVAAnual}
                    onChangeValue={(v) => setVeiculoForm({ ...veiculoForm, valorIPVAAnual: v ?? '' })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Custo Manutenção Estimado (R$/mês)</label>
                  <MoneyInput
                    value={veiculoForm.custoManutencaoEstimado}
                    onChangeValue={(v) => setVeiculoForm({ ...veiculoForm, custoManutencaoEstimado: v ?? '' })}
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary">Salvar Veículo</button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    localStorage.removeItem('draft_veiculo')
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

              {custoKm && custoKm.configuracaoPendente && (
                <div className="custo-km-card" style={{ background: '#fff8e6', borderLeft: '4px solid #b8860b' }}>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: '#8a6d0b' }}>
                    <strong>Informe os "KM rodados por mês a trabalho"</strong> para calcular o custo real por km.
                    Clique em Editar e preencha o campo.
                  </p>
                </div>
              )}

              {custoKm && !custoKm.configuracaoPendente && (
                <div className="custo-km-card">
                  <h3>Análise de Custos</h3>
                  <div className="custo-row">
                    <div className="custo-item">
                      <span className="label">Custo/KM:</span>
                      <span className="value">R$ {custoKm.custoKm}</span>
                    </div>
                    <div className="custo-item">
                      <span className="label">Custo Mensal ({custoKm.kmMensal} km):</span>
                      <span className="value">R$ {custoKm.totalCustoMensal?.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="custo-breakdown">
                    <p>
                      <strong>Combustível:</strong> R$ {custoKm.custoCombustivel?.toFixed(2)} |{' '}
                      <strong>Seguro:</strong> R$ {custoKm.custoSeguroMensal?.toFixed(2)} |{' '}
                      <strong>IPVA:</strong> R$ {custoKm.custoIPVAMensal?.toFixed(2)} |{' '}
                      <strong>Manutenção:</strong> R$ {custoKm.custoManutencaoMensal?.toFixed(2)} |{' '}
                      <strong>Depreciação:</strong> R$ {custoKm.custoDepreciacaoMensal?.toFixed(2)}
                      {custoKm.percentualUsoProfissional < 100 && (
                        <> | <strong>Uso profissional:</strong> {custoKm.percentualUsoProfissional}%</>
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="empty-message">Nenhum veículo cadastrado</p>
          )}
          </div>
          )}
        </div>

        {/* Seção de Precificação (Hora Técnica) */}
        <div className="perfil-card">
          <div className="card-header card-header-clicavel" onClick={() => toggleSection('precificacao')}>
            <h2>Precificação</h2>
            <ChevronDown size={18} className={`card-chevron ${expandedSections.precificacao ? 'aberto' : ''}`} />
          </div>
          <div className="card-content">
            <p className="card-description">
              Descubra quanto vale sua hora de trabalho e o preço justo de cada visita. Configure uma vez — o app calcula o resto.
              {perfil?.precificacao?.horaTecnica > 0 && (
                <> <strong style={{ color: '#0d6b3a' }}>Sua hora técnica: R$ {Number(perfil.precificacao.horaTecnica).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></>
              )}
            </p>
            {expandedSections.precificacao && (
            <button
              className="btn-manage-pricing"
              onClick={() => setPrecificacaoModalOpen(true)}
            >
              Calcular Hora Técnica e Visitas
            </button>
            )}
          </div>
        </div>

        {/* Seção de Tabela de Preços */}
        <div className="perfil-card">
          <div className="card-header card-header-clicavel" onClick={() => toggleSection('tabelaPrecos')}>
            <h2>Tabela de Preços</h2>
            <ChevronDown size={18} className={`card-chevron ${expandedSections.tabelaPrecos ? 'aberto' : ''}`} />
          </div>
          <div className="card-content">
            <p className="card-description">Gerencie os valores dos seus serviços e produtos de forma centralizada.</p>
            {expandedSections.tabelaPrecos && (
            <button
              className="btn-manage-pricing"
              onClick={() => setPricingModalOpen(true)}
            >
              Gerenciar Tabela de Preços
            </button>
            )}
          </div>
        </div>

        {/* Seção de Documentos Emitidos */}
        <div className="perfil-card">
          <div className="card-header card-header-clicavel" onClick={() => toggleSection('documentos')}>
            <h2>Documentos Emitidos</h2>
            <ChevronDown size={18} className={`card-chevron ${expandedSections.documentos ? 'aberto' : ''}`} />
          </div>
          <div className="card-content">
            <p className="card-description">Consulte os orçamentos e cobranças que você salvou, com a data de emissão, e gere o PDF novamente quando precisar.</p>
            {expandedSections.documentos && (
            <button
              className="btn-manage-pricing"
              onClick={() => setDocumentosModalOpen(true)}
            >
              Ver Documentos Emitidos
            </button>
            )}
          </div>
        </div>

        {/* Seção de Estoque de Insumos */}
        <div className="perfil-card">
          <div className="card-header card-header-clicavel" onClick={() => toggleSection('estoque')}>
            <h2>Estoque de Insumos</h2>
            <ChevronDown size={18} className={`card-chevron ${expandedSections.estoque ? 'aberto' : ''}`} />
          </div>
          <div className="card-content">
            <p className="card-description">Cadastre seringas, medicamentos e materiais de consumo. Ao usar no orçamento, o estoque é abatido automaticamente.</p>
            {expandedSections.estoque && (
            <button
              className="btn-manage-pricing"
              onClick={() => setEstoqueModalOpen(true)}
            >
              Gerenciar Estoque
            </button>
            )}
          </div>
        </div>

        {/* Seção de Notificações */}
        <div className="perfil-card">
          <div className="card-header card-header-clicavel" onClick={() => toggleSection('notificacoes')}>
            <h2>Notificações</h2>
            <ChevronDown size={18} className={`card-chevron ${expandedSections.notificacoes ? 'aberto' : ''}`} />
          </div>
          <div className="card-content">
            <p className="card-description">Escolha com quanto tempo de antecedência quer ser avisado dos agendamentos e o aviso de cobranças a vencer.</p>
            {expandedSections.notificacoes && (
            <button
              className="btn-manage-pricing"
              onClick={() => setNotificacoesModalOpen(true)}
            >
              Configurar Notificações
            </button>
            )}
          </div>
        </div>

        {/* Seção de White Label */}
        <div className="perfil-card">
          <div className="card-header card-header-clicavel" onClick={() => toggleSection('clinica')}>
            <h2>Configurar Clínica</h2>
            <ChevronDown size={18} className={`card-chevron ${expandedSections.clinica ? 'aberto' : ''}`} />
          </div>
          <div className="card-content">
            <p className="card-description">Personalize o nome, logomarca e informações da sua clínica para documentos e relatórios.</p>
            {expandedSections.clinica && (
            <button
              className="btn-manage-pricing"
              onClick={() => setWhiteLabelModalOpen(true)}
            >
              Configurar Identidade da Clínica
            </button>
            )}
          </div>
        </div>

        {/* Dados de Cobrança (Pix/Bancários) */}
        <div className="perfil-card">
          <div className="card-header card-header-clicavel" onClick={() => toggleSection('cobranca')}>
            <h2>Dados de Cobrança</h2>
            <ChevronDown size={18} className={`card-chevron ${expandedSections.cobranca ? 'aberto' : ''}`} />
          </div>
          <div className="card-content">
            <p className="card-description">
              Adicione aqui suas informações de Pix ou dados bancários. Elas aparecem somente no rodapé da cobrança enviada ao cliente, junto com o valor.
            </p>
            {expandedSections.cobranca && (
            <>
            <textarea
              value={dadosCobranca}
              onChange={(e) => setDadosCobranca(e.target.value)}
              placeholder={'Ex.: Pix: 12.345.678/0001-90\nBanco: 000 - Agência: 0001 - Conta: 12345-6'}
              rows={4}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontFamily: 'inherit',
                resize: 'vertical',
                marginBottom: '0.75rem'
              }}
            />
            <button
              className="btn-manage-pricing"
              onClick={handleSalvarDadosCobranca}
              disabled={salvandoCobranca}
            >
              {salvandoCobranca ? 'Salvando...' : 'Salvar Dados de Cobrança'}
            </button>
            </>
            )}
          </div>
        </div>

        {/* Compartilhamento de Animais */}
        <div className="perfil-card">
          <div className="card-header card-header-clicavel" onClick={() => toggleSection('compartilhar')}>
            <h2>Compartilhar Animais</h2>
            <ChevronDown size={18} className={`card-chevron ${expandedSections.compartilhar ? 'aberto' : ''}`} />
          </div>
          <div className="card-content">
            <p className="card-description">Compartilhe animais com outros veterinários (reabilitação, cirurgias) ou com proprietários para acompanhar o tratamento.</p>
            {expandedSections.compartilhar && (
            <button
              className="btn-manage-pricing"
              onClick={() => setCompartilharModalOpen(true)}
            >
              Compartilhar Animal
            </button>
            )}

            {expandedSections.compartilhar && compartilhamentosFeitos.length > 0 && (
              <div className="compartilhados-lista">
                <div className="compartilhados-lista-titulo">Animais que você compartilhou</div>
                {compartilhamentosFeitos.map(comp => (
                  <div key={comp.id} className="compartilhado-feito-item">
                    <div className="compartilhado-feito-info">
                      <span className="cfi-animal">{comp.Pet?.nome || 'Animal removido'}{comp.Pet?.especie ? ` (${comp.Pet.especie})` : ''}</span>
                      <span className="cfi-quem">
                        com {comp.veterinarioConvidado?.nome || comp.emailConvidado || 'convidado'}
                      </span>
                    </div>
                    <span className={`cfi-status cfi-status-${comp.status}`}>
                      {comp.status === 'aceito' ? 'Aceito' : comp.status === 'pendente' ? 'Pendente' : comp.status}
                    </span>
                    <button
                      type="button"
                      className="cfi-btn-revogar"
                      onClick={() => handleRevogarCompartilhamento(comp)}
                      title="Revogar acesso"
                    >
                      Revogar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Exportar Dados */}
        <div className="perfil-card">
          <div className="card-header card-header-clicavel" onClick={() => toggleSection('exportar')}>
            <h2>Exportar Dados</h2>
            <ChevronDown size={18} className={`card-chevron ${expandedSections.exportar ? 'aberto' : ''}`} />
          </div>
          <div className="card-content">
            <p className="card-description">Exporte cobranças, atendimentos ou faturamento em planilha (Excel/Google Sheets) por período.</p>
            {expandedSections.exportar && (
            <button
              className="btn-manage-pricing"
              onClick={() => setExportarModalOpen(true)}
            >
              Exportar Planilha
            </button>
            )}
          </div>
        </div>

        {/* Alterar Senha */}
        <div className="perfil-card">
          <div className="card-header card-header-clicavel" onClick={() => toggleSection('seguranca')}>
            <h2>Segurança</h2>
            <ChevronDown size={18} className={`card-chevron ${expandedSections.seguranca ? 'aberto' : ''}`} />
          </div>
          <div className="card-content">
            <p className="card-description">Altere sua senha ou recupere-a via WhatsApp se esquecer.</p>
            {expandedSections.seguranca && (
            <button
              className="btn-manage-pricing"
              onClick={() => setEsqueceSenhaModalOpen(true)}
            >
              Alterar Senha
            </button>
            )}
          </div>
        </div>

        {/* Atalho para a Lixeira */}
        <div className="perfil-card">
          <div className="card-header card-header-clicavel" onClick={() => toggleSection('lixeira')}>
            <h2>Lixeira</h2>
            <ChevronDown size={18} className={`card-chevron ${expandedSections.lixeira ? 'aberto' : ''}`} />
          </div>
          <div className="card-content">
            <p className="card-description">Recupere clientes, animais, agendamentos, históricos ou despesas apagados por engano.</p>
            {expandedSections.lixeira && (
            <button
              className="btn-manage-pricing"
              onClick={() => window.dispatchEvent(new CustomEvent('navegarPara', { detail: 'lixeira' }))}
            >
              Abrir Lixeira
            </button>
            )}
          </div>
        </div>

        {/* Logout */}
        <div className="perfil-card logout-card">
          <div className="card-content">
            <button
              className="btn-logout"
              onClick={handleLogout}
            >
              Sair do App
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
        perfil={perfil}
      />

      {/* Compartilhar Animal Modal */}
      <CompartilharAnimalModal
        isOpen={compartilharModalOpen}
        onClose={() => { setCompartilharModalOpen(false); fetchCompartilhamentosFeitos() }}
        animais={meusPets}
        onCompartilharSuccess={() => fetchData()}
      />

      {/* Esqueci Senha Modal */}
      <EsqueceSenhaModal
        isOpen={esqueceSenhaModalOpen}
        onClose={() => setEsqueceSenhaModalOpen(false)}
      />

      {/* Exportar Dados Modal */}
      <ExportarDadosModal
        isOpen={exportarModalOpen}
        onClose={() => setExportarModalOpen(false)}
      />

      {/* Estoque de Insumos Modal */}
      <EstoqueInsumosModal
        isOpen={estoqueModalOpen}
        onClose={() => setEstoqueModalOpen(false)}
      />

      {/* Documentos Emitidos Modal */}
      <DocumentosEmitidosModal
        isOpen={documentosModalOpen}
        onClose={() => setDocumentosModalOpen(false)}
      />

      {/* Notificações Modal */}
      {notificacoesModalOpen && (
        <NotificacoesModal
          veterinarioId={veterinarioId}
          onClose={() => setNotificacoesModalOpen(false)}
        />
      )}

      {/* Precificação Modal */}
      <PrecificacaoModal
        isOpen={precificacaoModalOpen}
        onClose={() => setPrecificacaoModalOpen(false)}
        perfil={perfil}
        custoKm={custoKm}
        onSaved={() => fetchData()}
      />
    </div>
  )
}
