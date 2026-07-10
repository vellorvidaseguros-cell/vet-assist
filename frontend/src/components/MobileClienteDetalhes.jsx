import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import axios from 'axios'
import { User, Phone, MapPin, Pencil, PawPrint, X, Plus, Camera, Cake, Check, FileText, Wallet } from 'lucide-react'
import './MobileClienteDetalhes.css'
import AnimalHistoryModal from './AnimalHistoryModal'
import QuoteModal from './QuoteModal'
import { calcularIdade } from '../utils/idadeUtils'
import { petFotoUrl } from '../utils/petFotoUrl'
import { useSwipeToClose } from '../hooks/useSwipeToClose'

const ANIMAL_VAZIO = { nome: '', especie: '', raca: '', sexo: '', porte: '', cor: '', microchip: '', dataNascimento: '' }

export default function MobileClienteDetalhes({ clienteId, onClose }) {
  const [cliente, setCliente] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [clienteEdit, setClienteEdit] = useState({})
  const [salvando, setSalvando] = useState(false)
  const { ref: swipeRef, style: swipeStyle } = useSwipeToClose(onClose)

  // Animal novo
  const [showNovoAnimal, setShowNovoAnimal] = useState(false)
  const [novoAnimal, setNovoAnimal] = useState(ANIMAL_VAZIO)
  const [salvandoAnimal, setSalvandoAnimal] = useState(false)

  // Edição de animal
  const [petEditId, setPetEditId] = useState(null)
  const [petEdit, setPetEdit] = useState(ANIMAL_VAZIO)

  // Foto do animal (novo ou em edição)
  const [fotoFile, setFotoFile] = useState(null)
  const [fotoPreview, setFotoPreview] = useState(null)

  const handleFotoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFotoFile(file)
    setFotoPreview(URL.createObjectURL(file))
  }

  const resetFoto = () => {
    setFotoFile(null)
    setFotoPreview(null)
  }

  const enviarFotoPet = async (petId) => {
    if (!fotoFile) return
    const formData = new FormData()
    formData.append('foto', fotoFile)
    await axios.post(`/api/pets/${petId}/foto`, formData)
  }

  // Histórico de animal
  const [showHistorico, setShowHistorico] = useState(false)
  const [historicoAnimal, setHistoricoAnimal] = useState(null)

  // Orçamento
  const [showOrcamento, setShowOrcamento] = useState(false)
  const [orcamentoAnimal, setOrcamentoAnimal] = useState(null)

  useEffect(() => { fetchCliente() }, [clienteId])

  // Bloquear scroll do body quando modal está aberto
  useEffect(() => {
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [])

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
      const payload = {
        nome: novoAnimal.nome,
        especie: novoAnimal.especie,
        raca: novoAnimal.raca,
        sexo: novoAnimal.sexo,
        porte: novoAnimal.porte,
        cor: novoAnimal.cor,
        microchip: novoAnimal.microchip,
        dataNascimento: novoAnimal.dataNascimento || null,
        clienteId: parseInt(clienteId)
      }
      const res = await axios.post('/api/pets', payload)
      if (res.data.sucesso) {
        const novoPetId = res.data.data?.id
        if (novoPetId) await enviarFotoPet(novoPetId)
        setShowNovoAnimal(false)
        setNovoAnimal(ANIMAL_VAZIO)
        resetFoto()
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
    resetFoto()
    setPetEditId(pet.id)
    // Converter dataNascimento ISO para formato YYYY-MM-DD (input type=date)
    const dataNascStr = pet.dataNascimento
      ? new Date(pet.dataNascimento).toISOString().split('T')[0]
      : ''
    setPetEdit({
      nome: pet.nome || '',
      especie: pet.especie || '',
      raca: pet.raca || '',
      sexo: pet.sexo || '',
      porte: pet.porte || '',
      cor: pet.cor || '',
      microchip: pet.microchip || '',
      dataNascimento: dataNascStr,
      foto: pet.foto || null
    })
  }

  const handleSalvarPet = async () => {
    if (!petEdit.nome.trim() || !petEdit.especie.trim()) { setError('Nome e Espécie são obrigatórios'); return }
    setSalvandoAnimal(true)
    setError('')
    try {
      const payload = {
        nome: petEdit.nome,
        especie: petEdit.especie,
        raca: petEdit.raca,
        sexo: petEdit.sexo,
        porte: petEdit.porte,
        cor: petEdit.cor,
        microchip: petEdit.microchip,
        dataNascimento: petEdit.dataNascimento || null
      }
      const res = await axios.put(`/api/pets/${petEditId}`, payload)
      if (res.data.sucesso) {
        if (fotoFile) await enviarFotoPet(petEditId)
        setPetEditId(null)
        resetFoto()
        await fetchCliente()
      }
      else setError('Erro ao salvar animal')
    } catch { setError('Erro ao salvar animal') }
    finally { setSalvandoAnimal(false) }
  }

  const handleAbrirHistorico = (pet) => {
    setHistoricoAnimal(pet)
    setShowHistorico(true)
  }

  const handleAbrirOrcamento = (pet) => {
    setOrcamentoAnimal(pet)
    setShowOrcamento(true)
  }

  const inputStyle = { padding: '8px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px', width: '100%', boxSizing: 'border-box' }
  const gridStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }

  if (loading) return createPortal(
    <div className="modal-overlay">
      <div className="modal-content detalhes-modal">
        <div style={{ padding: '2rem', textAlign: 'center' }}>Carregando...</div>
      </div>
    </div>,
    document.body
  )

  if (!cliente) return null

  return createPortal(
    <div className="modal-overlay" ref={swipeRef} style={swipeStyle}>
      <div className="modal-content detalhes-modal">

        {/* Header — sem botão × */}
        <div className="modal-header">
          <div className="detalhes-titulo">
            <h3>{isEditing ? clienteEdit.nome || cliente.nome : cliente.nome}</h3>
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
                <h4>Contato</h4>
                {cliente.telefone && <p className="detalhes-text"><strong>Telefone:</strong> {cliente.telefone}</p>}
                {cliente.email && <p className="detalhes-text"><strong>Email:</strong> {cliente.email}</p>}
                {cliente.cpf && <p className="detalhes-text"><strong>CPF:</strong> {cliente.cpf}</p>}
              </div>

              {(cliente.endereco || cliente.cidade || cliente.estado) && (
                <div className="detalhes-section info-section">
                  <h4>Endereço</h4>
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
              <h4>Editar Dados</h4>
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
            <div className="animais-header">
              <h4>Animais</h4>
              <button
                type="button"
                className="animais-btn-adicionar"
                onClick={() => { setShowNovoAnimal(!showNovoAnimal); setError(''); resetFoto() }}
              >
                {showNovoAnimal ? <><X size={14} /> Cancelar</> : <><Plus size={14} /> Adicionar</>}
              </button>
            </div>

            {/* Form novo animal */}
            {showNovoAnimal && (
              <div className="novo-animal-form">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <label htmlFor="mobile-foto-novo" style={{
                    width: '52px', height: '52px', borderRadius: '50%', background: '#eef0fb',
                    border: '1.5px solid #ddd', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden', cursor: 'pointer', flexShrink: 0
                  }}>
                    {fotoPreview
                      ? <img src={fotoPreview} alt="Foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <PawPrint size={22} />}
                  </label>
                  <input id="mobile-foto-novo" type="file" accept="image/*" onChange={handleFotoChange} style={{ display: 'none' }} />
                  <label htmlFor="mobile-foto-novo" style={{
                    padding: '8px 12px', border: '1.5px solid #0d6b3a', borderRadius: '6px',
                    color: '#0d6b3a', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '6px'
                  }}>
                    <Camera size={14} /> {fotoPreview ? 'Trocar Foto' : 'Adicionar Foto'}
                  </label>
                </div>
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
                <div style={{ marginBottom: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#666', fontWeight: 600, marginBottom: '4px' }}>
                    <Cake size={14} /> Data de Nascimento
                  </label>
                  <input
                    style={{
                      ...inputStyle,
                      WebkitAppearance: 'none',
                      appearance: 'none',
                      minHeight: '40px',
                      lineHeight: 'normal',
                      backgroundColor: 'white',
                      color: novoAnimal.dataNascimento ? '#333' : '#999'
                    }}
                    type="date"
                    name="dataNascimento"
                    max={new Date().toISOString().split('T')[0]}
                    value={novoAnimal.dataNascimento}
                    onChange={e => setNovoAnimal(p => ({ ...p, dataNascimento: e.target.value }))}
                  />
                  {novoAnimal.dataNascimento && (
                    <p style={{ fontSize: '12px', color: '#0d6b3a', fontWeight: 600, margin: '6px 0 0 0' }}>
                      Idade: {calcularIdade(novoAnimal.dataNascimento).texto}
                    </p>
                  )}
                </div>
                <button type="button" className="novo-animal-btn-save" onClick={handleAdicionarAnimal} disabled={salvandoAnimal}>
                  {salvandoAnimal ? 'Salvando...' : 'Adicionar Animal'}
                </button>
              </div>
            )}

            {/* Lista de pets */}
            {cliente.Pets && cliente.Pets.map(pet => (
              <div key={pet.id}>
                {petEditId === pet.id ? (
                  // Form edição do pet
                  <div className="pet-edit-form">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                      <label htmlFor={`mobile-foto-edit-${pet.id}`} style={{
                        width: '52px', height: '52px', borderRadius: '50%', background: '#eef0fb',
                        border: '1.5px solid #ddd', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        overflow: 'hidden', cursor: 'pointer', flexShrink: 0
                      }}>
                        {fotoPreview ? (
                          <img src={fotoPreview} alt="Foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : pet.foto ? (
                          <img src={petFotoUrl(pet.id)} alt="Foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <PawPrint size={22} />
                        )}
                      </label>
                      <input id={`mobile-foto-edit-${pet.id}`} type="file" accept="image/*" onChange={handleFotoChange} style={{ display: 'none' }} />
                      <label htmlFor={`mobile-foto-edit-${pet.id}`} style={{
                        padding: '8px 12px', border: '1.5px solid #0d6b3a', borderRadius: '6px',
                        color: '#0d6b3a', fontSize: '12px', fontWeight: 600, cursor: 'pointer'
                      }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><Camera size={14} /> {fotoPreview || pet.foto ? 'Trocar Foto' : 'Adicionar Foto'}</span>
                      </label>
                    </div>
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
                    <div style={{ marginBottom: '8px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#666', fontWeight: 600, marginBottom: '4px' }}>
                        <Cake size={14} /> Data de Nascimento
                      </label>
                      <input
                        style={{
                          ...inputStyle,
                          WebkitAppearance: 'none',
                          appearance: 'none',
                          minHeight: '40px',
                          lineHeight: 'normal',
                          backgroundColor: 'white',
                          color: petEdit.dataNascimento ? '#333' : '#999'
                        }}
                        type="date"
                        max={new Date().toISOString().split('T')[0]}
                        value={petEdit.dataNascimento}
                        onChange={e => setPetEdit(p => ({ ...p, dataNascimento: e.target.value }))}
                      />
                      {petEdit.dataNascimento && (
                        <p style={{ fontSize: '12px', color: '#0d6b3a', fontWeight: 600, margin: '6px 0 0 0' }}>
                          Idade: {calcularIdade(petEdit.dataNascimento).texto}
                        </p>
                      )}
                    </div>
                    <div className="pet-form-actions">
                      <button type="button" className="pet-form-btn-cancel" onClick={() => { setPetEditId(null); resetFoto() }}>
                        Cancelar
                      </button>
                      <button type="button" className="pet-form-btn-save" onClick={handleSalvarPet} disabled={salvandoAnimal}>
                        {salvandoAnimal ? 'Salvando...' : 'Salvar'}
                      </button>
                    </div>
                  </div>
                ) : (
                  // Visualização do pet
                  <div className="pet-card">
                    <div className="pet-header">
                      {pet.foto ? (
                        <img
                          src={petFotoUrl(pet.id)}
                          alt={pet.nome}
                          className="pet-icon"
                          style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div className="pet-icon"><PawPrint size={20} /></div>
                      )}
                      <div className="pet-info-card">
                        <p className="pet-name">{pet.nome}</p>
                        <p className="pet-details">
                          {[pet.especie && `Espécie: ${pet.especie}`, pet.raca && `Raça: ${pet.raca}`, pet.sexo && `Sexo: ${pet.sexo === 'M' ? 'Macho' : 'Fêmea'}`].filter(Boolean).join(' | ')}
                        </p>
                        {(pet.dataNascimento || pet.idade) && (
                          <p className="pet-details" style={{ color: '#0d6b3a', fontWeight: 600 }}>
                            {pet.dataNascimento
                              ? calcularIdade(pet.dataNascimento).texto
                              : `${pet.idade} ano${pet.idade !== 1 ? 's' : ''}`}
                          </p>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', width: '100%', flexWrap: 'wrap' }}>
                      <button type="button" className="pet-edit-btn pet-btn-responsive" onClick={() => handleEditarPet(pet)}>
                        Editar
                      </button>
                      <button type="button" className="pet-history-btn pet-btn-responsive" onClick={() => handleAbrirHistorico(pet)}>
                        Histórico
                      </button>
                      <button type="button" className="pet-quote-btn pet-btn-responsive" onClick={() => handleAbrirOrcamento(pet)}>
                        Orçamento
                      </button>
                    </div>
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
                {salvando ? 'Salvando...' : 'Salvar'}
              </button>
            </>
          ) : (
            <>
              <button type="button" className="btn-cancelar" onClick={onClose}>
                Voltar
              </button>
              <button type="button" className="btn-registrar" onClick={handleEditarCliente}>
                Editar
              </button>
            </>
          )}
        </div>
      </div>

      {showHistorico && historicoAnimal && (
        <AnimalHistoryModal
          petId={historicoAnimal.id}
          petName={historicoAnimal.nome}
          onClose={() => {
            setShowHistorico(false)
            setHistoricoAnimal(null)
          }}
        />
      )}

      {showOrcamento && orcamentoAnimal && (
        <QuoteModal
          cliente={cliente}
          pet={orcamentoAnimal}
          veterinario={{ clinica: 'Clínica Veterinária', cnpj: '00.000.000/0000-00', telefone: '(00) 0000-0000', email: 'contato@clinica.com', endereco: 'Endereço da Clínica' }}
          onClose={() => {
            setShowOrcamento(false)
            setOrcamentoAnimal(null)
          }}
        />
      )}
    </div>,
    document.body
  )
}
