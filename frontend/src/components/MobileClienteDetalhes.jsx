import { useState, useEffect } from 'react'
import axios from 'axios'
import './MobileClienteDetalhes.css'

export default function MobileClienteDetalhes({ clienteId, onClose }) {
  const [cliente, setCliente] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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
            <button className="btn-close" onClick={onClose}>×</button>
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
          <button className="btn-close" onClick={onClose}>×</button>
        </div>

        {error && (
          <div className="error-message">
            {error}
            <button onClick={() => setError('')}>×</button>
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
              {cliente.cidade || cliente.estado && (
                <p className="detalhes-text">
                  <strong>Localidade:</strong> {cliente.cidade}{cliente.cidade && cliente.estado ? ', ' : ''}{cliente.estado}
                </p>
              )}
            </div>
          )}

          {/* Animais */}
          {cliente.Pets && cliente.Pets.length > 0 && (
            <div className="detalhes-section fotos-section">
              <h4>🐾 Animais</h4>
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
            </div>
          )}
        </div>

        {/* Footer / Ações */}
        <div className="modal-actions">
          <button
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
