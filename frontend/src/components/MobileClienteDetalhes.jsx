import { useState, useEffect } from 'react'
import axios from 'axios'
import './MobileClienteDetalhes.css'

export default function MobileClienteDetalhes({ clienteId, onClose }) {
  const [cliente, setCliente] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showNovoAnimal, setShowNovoAnimal] = useState(false)
  const [novoAnimal, setNovoAnimal] = useState({
    nome: '',
    especie: '',
    raca: '',
    sexo: '',
    porte: '',
    idade: '',
    cor: '',
    microchip: ''
  })
  const [salvandoAnimal, setSalvandoAnimal] = useState(false)

  useEffect(() => {
    fetchCliente()
  }, [clienteId])

  const fetchCliente = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`/api/clientes/${clienteId}`)
      if (response.data.sucesso) {
        setCliente(response.data.data)
      }
    } catch (err) {
      setError('Erro ao carregar dados do cliente')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleAdicionarAnimal = async () => {
    if (!novoAnimal.nome.trim() || !novoAnimal.especie.trim()) {
      setError('Nome e Espécie do animal são obrigatórios')
      return
    }

    setSalvandoAnimal(true)
    setError('')

    try {
      const response = await axios.post('/api/pets', {
        ...novoAnimal,
        clienteId: parseInt(clienteId)
      })

      if (response.data.sucesso) {
        setShowNovoAnimal(false)
        setNovoAnimal({
          nome: '',
          especie: '',
          raca: '',
          sexo: '',
          porte: '',
          idade: '',
          cor: '',
          microchip: ''
        })
        await fetchCliente()
      } else {
        setError('Erro ao adicionar animal')
      }
    } catch (err) {
      setError('Erro ao salvar animal')
      console.error(err)
    } finally {
      setSalvandoAnimal(false)
    }
  }

  const handleChangeAnimal = (e) => {
    const { name, value } = e.target
    setNovoAnimal(prev => ({ ...prev, [name]: value }))
  }

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal-content detalhes-modal">
          <div style={{ padding: '2rem', textAlign: 'center' }}>Carregando...</div>
        </div>
      </div>
    )
  }

  if (!cliente) {
    return (
      <div className="modal-overlay">
        <div className="modal-content detalhes-modal">
          <div className="modal-header">
            <h3>Cliente não encontrado</h3>
            <button type="button" className="btn-close" onClick={onClose}>×</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content detalhes-modal">
        {/* Header */}
        <div className="modal-header">
          <div className="detalhes-titulo">
            <h3>👤 {cliente.nome}</h3>
            <span className="detalhes-data">{cliente.Pets ? cliente.Pets.length : 0} animal(is)</span>
          </div>
          <button type="button" className="btn-close" onClick={onClose}>×</button>
        </div>

        {error && (
          <div className="error-message">
            {error}
            <button type="button" onClick={() => setError('')}>×</button>
          </div>
        )}

        {/* Conteúdo */}
        <div className="detalhes-body">
          {/* Informações de Contato */}
          <div className="detalhes-section info-section">
            <h4>📞 Contato</h4>
            {cliente.telefone && (
              <p className="detalhes-text">
                <strong>Telefone:</strong> {cliente.telefone}
              </p>
            )}
            {cliente.email && (
              <p className="detalhes-text">
                <strong>Email:</strong> {cliente.email}
              </p>
            )}
            {cliente.cpf && (
              <p className="detalhes-text">
                <strong>CPF:</strong> {cliente.cpf}
              </p>
            )}
          </div>

          {/* Endereço */}
          {(cliente.endereco || cliente.cidade || cliente.estado) && (
            <div className="detalhes-section info-section">
              <h4>📍 Endereço</h4>
              {cliente.endereco && (
                <p className="detalhes-text">
                  <strong>Rua:</strong> {cliente.endereco}
                </p>
              )}
              {(cliente.cidade || cliente.estado) && (
                <p className="detalhes-text">
                  <strong>Localidade:</strong> {cliente.cidade}{cliente.cidade && cliente.estado ? ', ' : ''}{cliente.estado}
                </p>
              )}
            </div>
          )}

          {/* Animais */}
          <div className="detalhes-section fotos-section">
            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', width: '100%', gap: '8px' }}>
              <h4 style={{ margin: 0, flex: '1 1 auto', minWidth: 0 }}>🐾 Animais</h4>
              <button
                type="button"
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#007aff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  flex: '0 0 auto',
                  width: 'auto',
                  whiteSpace: 'nowrap'
                }}
                onClick={() => { if (showNovoAnimal) setError(''); setShowNovoAnimal(!showNovoAnimal); }}
              >
                {showNovoAnimal ? '✕ Cancelar' : '+ Adicionar'}
              </button>
            </div>

            {showNovoAnimal && (
              <div style={{
                backgroundColor: '#f9f9f9',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '12px',
                border: '1px solid #e5e5ea'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                  <input
                    type="text"
                    name="nome"
                    placeholder="Nome *"
                    value={novoAnimal.nome}
                    onChange={handleChangeAnimal}
                    style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px' }}
                  />
                  <input
                    type="text"
                    name="especie"
                    placeholder="Espécie *"
                    value={novoAnimal.especie}
                    onChange={handleChangeAnimal}
                    style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                  <input
                    type="text"
                    name="raca"
                    placeholder="Raça"
                    value={novoAnimal.raca}
                    onChange={handleChangeAnimal}
                    style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px' }}
                  />
                  <select
                    name="sexo"
                    value={novoAnimal.sexo}
                    onChange={handleChangeAnimal}
                    style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px' }}
                  >
                    <option value="">Sexo</option>
                    <option value="M">Macho</option>
                    <option value="F">Fêmea</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                  <select
                    name="porte"
                    value={novoAnimal.porte}
                    onChange={handleChangeAnimal}
                    style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px' }}
                  >
                    <option value="">Porte</option>
                    <option value="P">Pequeno</option>
                    <option value="M">Médio</option>
                    <option value="G">Grande</option>
                  </select>
                  <input
                    type="number"
                    name="idade"
                    placeholder="Idade (anos)"
                    value={novoAnimal.idade}
                    onChange={handleChangeAnimal}
                    style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                  <input
                    type="text"
                    name="cor"
                    placeholder="Cor/Pelagem"
                    value={novoAnimal.cor}
                    onChange={handleChangeAnimal}
                    style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px' }}
                  />
                  <input
                    type="text"
                    name="microchip"
                    placeholder="Microchip"
                    value={novoAnimal.microchip}
                    onChange={handleChangeAnimal}
                    style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px' }}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAdicionarAnimal}
                  disabled={salvandoAnimal}
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#34c759',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    opacity: salvandoAnimal ? 0.6 : 1
                  }}
                >
                  {salvandoAnimal ? 'Salvando...' : '✓ Adicionar Animal'}
                </button>
              </div>
            )}

            {cliente.Pets && cliente.Pets.length > 0 && (
              <div className="pets-list">
                {cliente.Pets.map(pet => (
                  <div key={pet.id} className="pet-card">
                    <div className="pet-icon">🐾</div>
                    <div className="pet-info-card">
                      <p className="pet-name">{pet.nome}</p>
                      <p className="pet-details">
                        {[
                          pet.especie && `Espécie: ${pet.especie}`,
                          pet.raca && `Raça: ${pet.raca}`,
                          pet.sexo && `Sexo: ${pet.sexo === 'M' ? 'Macho' : 'Fêmea'}`,
                          pet.porte && `Porte: ${pet.porte === 'P' ? 'Pequeno' : pet.porte === 'M' ? 'Médio' : 'Grande'}`
                        ].filter(Boolean).join(' | ')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {(!cliente.Pets || cliente.Pets.length === 0) && !showNovoAnimal && (
              <p style={{ textAlign: 'center', color: '#8e8e93', fontSize: '13px', margin: '12px 0' }}>
                Nenhum animal cadastrado
              </p>
            )}
          </div>
        </div>

        {/* Footer / Ações */}
        <div className="modal-actions">
          <button
            type="button"
            className="btn-cancelar"
            onClick={onClose}
          >
            Voltar
          </button>
        </div>
      </div>
    </div>
  )
}
