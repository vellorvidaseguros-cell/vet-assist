import { useState, useEffect } from 'react'
import axios from 'axios'
import './MobileClienteDetalhes.css'

const ANIMAL_VAZIO = { nome: '', especie: '', raca: '', sexo: '', porte: '', idade: '', cor: '', microchip: '' }

export default function MobileClienteDetalhes({ clienteId, onClose }) {
  const [cliente, setCliente] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [clienteEdit, setClienteEdit] = useState({})
  const [salvando, setSalvando] = useState(false)

  // Animal novo
  const [showNovoAnimal, setShowNovoAnimal] = useState(false)
  const [novoAnimal, setNovoAnimal] = useState(ANIMAL_VAZIO)
  const [salvandoAnimal, setSalvandoAnimal] = useState(false)

  // Edição de animal
  const [petEditId, setPetEditId] = useState(null)
  const [petEdit, setPetEdit] = useState(ANIMAL_VAZIO)

  useEffect(() => { fetchCliente() }, [clienteId])

  const fetchCliente = async () => {
    try {
      setLoading(true)
      const res = await axios.get(`/api/clientes/${clienteId}`)
      if (res.data.sucesso) setCliente(res.data.data)
    } catch (err) {
      setError('Erro ao carregar dados do cliente')
    } finally {
      setLoading(false)
    }
  }

  const handleEditarCliente = () => {
    setClienteEdit({
      nome: cliente.nome || '',
      telefone: cliente.telefone || '',
      email: cliente.email || '',
      cpf: cliente.cpf || '',
      endereco: cliente.endereco || '',
      cidade: cliente.cidade || '',
      estado: cliente.estado || ''
    })
    setIsEditing(true)
  }

  const handleSalvarCliente = async () => {
    if (!clienteEdit.nome?.trim()) { setError('Nome é obrigatório'); return }
    setSalvando(true)
    setError('')
    try {
      const res = await axios.put(`/api/clientes/${clienteId}`, clienteEdit)
      if (res.data.sucesso) {
        await fetchCliente()
        setIsEditing(false)
      } else {
        setError(res.data.erro || 'Erro ao salvar')
      }
    } catch (err) {
      setError('Erro ao salvar cliente')
    } finally {
      setSalvando(false)
    }
  }

  const handleAdicionarAnimal = async () => {
    if (!novoAnimal.nome.trim() || !novoAnimal.especie.trim()) {
      setError('Nome e Espécie são obrigatórios')
      return
    }
    setSalvandoAnimal(true)
    setError('')
    try {
      const res = await axios.post('/api/pets', { ...novoAnimal, clienteId: parseInt(clienteId) })
      if (res.data.sucesso) {
        setShowNovoAnimal(false)
        setNovoAnimal(ANIMAL_VAZIO)
        await fetchCliente()
      } else {
        setError('Erro ao adicionar animal')
      }
    } catch {
      setError('Erro ao salvar animal')
    } finally {
      setSalvandoAnimal(false)
    }
  }

  const handleEditarPet = (pet) => {
    setPetEditId(pet.id)
    setPetEdit({ nome: pet.nome || '', especie: pet.especie || '', raca: pet.raca || '', sexo: pet.sexo || '', porte: pet.porte || '', idade: pet.idade || '', cor: pet.cor || '', microchip: pet.microchip || '' })
  }

  const handleSalvarPet = async () => {
    if (!petEdit.nome.trim() || !petEdit.especie.trim()) { setError('Nome e Espécie são obrigatórios'); return }
    setSalvandoAnimal(true)
    setError('')
    try {
      const res = await axios.put(`/api/pets/${petEditId}`, petEdit)
      if (res.data.sucesso) { setPetEditId(null); await fetchCliente() }
      else setError('Erro ao salvar animal')
    } catch { setError('Erro ao salvar animal') }
    finally { setSalvandoAnimal(false) }
  }

  const inputStyle = { padding: '8px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px', width: '100%', boxSizing: 'border-box' }
  const gridStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }

  if (loading) return (
    <div className="modal-overlay">
      <div className="modal-content detalhes-modal">
        <div style={{ padding: '2rem', textAlign: 'center' }}>Carregando...</div>
      </div>
    </div>
  )

  if (!cliente) return null

  return (
    <div className="modal-overlay">
      <div className="modal-content detalhes-modal">

        {/* Header — sem botão × */}
        <div className="modal-header">
          <div className="detalhes-titulo">
            <h3>👤 {isEditing ? clienteEdit.nome || cliente.nome : cliente.nome}</h3>
            <span className="detalhes-data">{cliente.Pets?.length || 0} animal(is)</span>
          </div>
        </div>

        {error && (
          <div className="error-message">
            {error}
            <button type="button" onClick={() => setError('')}>×</button>
          </div>
        )}

        <div className="detalhes-body">

          {/* ── MODO VISUALIZAÇÃO ── */}
          {!isEditing && (
            <>
              <div className="detalhes-section info-section">
                <h4>📞 Contato</h4>
                {cliente.telefone && <p className="detalhes-text"><strong>Telefone:</strong> {cliente.telefone}</p>}
                {cliente.email && <p className="detalhes-text"><strong>Email:</strong> {cliente.email}</p>}
                {cliente.cpf && <p className="detalhes-text"><strong>CPF:</strong> {cliente.cpf}</p>}
              </div>

              {(cliente.endereco || cliente.cidade || cliente.estado) && (
                <div className="detalhes-section info-section">
                  <h4>📍 Endereço</h4>
                  {cliente.endereco && <p className="detalhes-text"><strong>Rua:</strong> {cliente.endereco}</p>}
                  {(cliente.cidade || cliente.estado) && (
                    <p className="detalhes-text"><strong>Localidade:</strong> {cliente.cidade}{cliente.cidade && cliente.estado ? ', ' : ''}{cliente.estado}</p>
                  )}
                </div>
              )}
            </>
          )}

          {/* ── MODO EDIÇÃO CLIENTE ── */}
          {isEditing && (
            <div className="detalhes-section info-section">
              <h4>✏️ Editar Dados</h4>
              <div style={gridStyle}>
                <input style={inputStyle} placeholder="Nome *" value={clienteEdit.nome} onChange={e => setClienteEdit(p => ({ ...p, nome: e.target.value }))} />
                <input style={inputStyle} placeholder="Telefone" value={clienteEdit.telefone} onChange={e => setClienteEdit(p => ({ ...p, telefone: e.target.value }))} />
              </div>
              <div style={gridStyle}>
                <input style={inputStyle} placeholder="Email" value={clienteEdit.email} onChange={e => setClienteEdit(p => ({ ...p, email: e.target.value }))} />
                <input style={inputStyle} placeholder="CPF" value={clienteEdit.cpf} onChange={e => setClienteEdit(p => ({ ...p, cpf: e.target.value }))} />
              </div>
              <input style={{ ...inputStyle, marginBottom: '8px' }} placeholder="Endereço" value={clienteEdit.endereco} onChange={e => setClienteEdit(p => ({ ...p, endereco: e.target.value }))} />
              <div style={gridStyle}>
                <input style={inputStyle} placeholder="Cidade" value={clienteEdit.cidade} onChange={e => setClienteEdit(p => ({ ...p, cidade: e.target.value }))} />
                <input style={inputStyle} placeholder="Estado" value={clienteEdit.estado} onChange={e => setClienteEdit(p => ({ ...p, estado: e.target.value }))} />
              </div>
            </div>
          )}

          {/* ── ANIMAIS ── */}
          <div className="detalhes-section fotos-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h4 style={{ margin: 0 }}>🐾 Animais</h4>
              <button
                type="button"
                onClick={() => { setShowNovoAnimal(!showNovoAnimal); setError('') }}
                style={{ padding: '6px 12px', backgroundColor: '#007aff', color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap', width: 'auto', marginBottom: 0 }}
              >
                {showNovoAnimal ? '✕ Cancelar' : '+ Adicionar'}
              </button>
            </div>

            {/* Form novo animal */}
            {showNovoAnimal && (
              <div style={{ backgroundColor: '#f9f9f9', padding: '12px', borderRadius: '8px', marginBottom: '12px', border: '1px solid #e5e5ea' }}>
                <div style={gridStyle}>
                  <input style={inputStyle} name="nome" placeholder="Nome *" value={novoAnimal.nome} onChange={e => setNovoAnimal(p => ({ ...p, nome: e.target.value }))} />
                  <input style={inputStyle} name="especie" placeholder="Espécie *" value={novoAnimal.especie} onChange={e => setNovoAnimal(p => ({ ...p, especie: e.target.value }))} />
                </div>
                <div style={gridStyle}>
                  <input style={inputStyle} name="raca" placeholder="Raça" value={novoAnimal.raca} onChange={e => setNovoAnimal(p => ({ ...p, raca: e.target.value }))} />
                  <select style={inputStyle} name="sexo" value={novoAnimal.sexo} onChange={e => setNovoAnimal(p => ({ ...p, sexo: e.target.value }))}>
                    <option value="">Sexo</option><option value="M">Macho</option><option value="F">Fêmea</option>
                  </select>
                </div>
                <div style={gridStyle}>
                  <input style={inputStyle} name="cor" placeholder="Cor/Pelagem" value={novoAnimal.cor} onChange={e => setNovoAnimal(p => ({ ...p, cor: e.target.value }))} />
                  <input style={inputStyle} name="microchip" placeholder="Microchip" value={novoAnimal.microchip} onChange={e => setNovoAnimal(p => ({ ...p, microchip: e.target.value }))} />
                </div>
                <button type="button" onClick={handleAdicionarAnimal} disabled={salvandoAnimal}
                  style={{ width: '100%', padding: '10px', backgroundColor: '#34c759', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', marginBottom: 0 }}>
                  {salvandoAnimal ? 'Salvando...' : '✓ Adicionar Animal'}
                </button>
              </div>
            )}

            {/* Lista de pets */}
            {cliente.Pets && cliente.Pets.map(pet => (
              <div key={pet.id}>
                {petEditId === pet.id ? (
                  // Form edição do pet
                  <div style={{ backgroundColor: '#f0f8ff', padding: '12px', borderRadius: '8px', marginBottom: '8px', border: '1px solid #007aff' }}>
                    <div style={gridStyle}>
                      <input style={inputStyle} placeholder="Nome *" value={petEdit.nome} onChange={e => setPetEdit(p => ({ ...p, nome: e.target.value }))} />
                      <input style={inputStyle} placeholder="Espécie *" value={petEdit.especie} onChange={e => setPetEdit(p => ({ ...p, especie: e.target.value }))} />
                    </div>
                    <div style={gridStyle}>
                      <input style={inputStyle} placeholder="Raça" value={petEdit.raca} onChange={e => setPetEdit(p => ({ ...p, raca: e.target.value }))} />
                      <select style={inputStyle} value={petEdit.sexo} onChange={e => setPetEdit(p => ({ ...p, sexo: e.target.value }))}>
                        <option value="">Sexo</option><option value="M">Macho</option><option value="F">Fêmea</option>
                      </select>
                    </div>
                    <div style={gridStyle}>
                      <input style={inputStyle} placeholder="Cor/Pelagem" value={petEdit.cor} onChange={e => setPetEdit(p => ({ ...p, cor: e.target.value }))} />
                      <input style={inputStyle} placeholder="Microchip" value={petEdit.microchip} onChange={e => setPetEdit(p => ({ ...p, microchip: e.target.value }))} />
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button type="button" onClick={() => setPetEditId(null)} style={{ flex: 1, padding: '8px', backgroundColor: '#f0f0f0', color: '#333', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', marginBottom: 0 }}>
                        Cancelar
                      </button>
                      <button type="button" onClick={handleSalvarPet} disabled={salvandoAnimal} style={{ flex: 1, padding: '8px', backgroundColor: '#007aff', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', marginBottom: 0 }}>
                        {salvandoAnimal ? 'Salvando...' : '✓ Salvar'}
                      </button>
                    </div>
                  </div>
                ) : (
                  // Visualização do pet
                  <div className="pet-card" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div className="pet-icon">🐾</div>
                    <div className="pet-info-card" style={{ flex: 1 }}>
                      <p className="pet-name">{pet.nome}</p>
                      <p className="pet-details">
                        {[pet.especie && `Espécie: ${pet.especie}`, pet.raca && `Raça: ${pet.raca}`, pet.sexo && `Sexo: ${pet.sexo === 'M' ? 'Macho' : 'Fêmea'}`].filter(Boolean).join(' | ')}
                      </p>
                    </div>
                    <button type="button" onClick={() => handleEditarPet(pet)}
                      style={{ background: 'none', border: '1px solid #007aff', color: '#007aff', borderRadius: '6px', padding: '4px 10px', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap', width: 'auto', marginBottom: 0 }}>
                      ✏️ Editar
                    </button>
                  </div>
                )}
              </div>
            ))}

            {(!cliente.Pets || cliente.Pets.length === 0) && !showNovoAnimal && (
              <p style={{ textAlign: 'center', color: '#8e8e93', fontSize: '13px', margin: '12px 0' }}>Nenhum animal cadastrado</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="modal-actions">
          {isEditing ? (
            <>
              <button type="button" className="btn-cancelar" onClick={() => setIsEditing(false)} disabled={salvando}>
                Cancelar
              </button>
              <button type="button" className="btn-registrar" onClick={handleSalvarCliente} disabled={salvando}>
                {salvando ? 'Salvando...' : '✓ Salvar'}
              </button>
            </>
          ) : (
            <>
              <button type="button" className="btn-cancelar" onClick={onClose}>
                Voltar
              </button>
              <button type="button" className="btn-registrar" onClick={handleEditarCliente}>
                ✏️ Editar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
