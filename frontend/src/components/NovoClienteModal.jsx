import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import axios from 'axios'
import './NovoClienteModal.css'

function useLockBodyScroll() {
  useEffect(() => {
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = original }
  }, [])
}

const ANIMAL_VAZIO = {
  nome: '',
  especie: '',
  raca: '',
  sexo: '',
  porte: '',
  idade: '',
  cor: '',
  microchip: ''
}

const CLIENTE_VAZIO = {
  nome: '',
  telefone: '',
  email: '',
  cpf: '',
  endereco: '',
  cidade: '',
  estado: ''
}

export default function NovoClienteModal({ onClose, onSuccess }) {
  useLockBodyScroll()

  const [clienteForm, setClienteForm] = useState(CLIENTE_VAZIO)
  const [animais, setAnimais] = useState([])
  const [showAnimalForm, setShowAnimalForm] = useState(false)
  const [animalForm, setAnimalForm] = useState(ANIMAL_VAZIO)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  const handleClienteChange = (e) => {
    setClienteForm({ ...clienteForm, [e.target.name]: e.target.value })
  }

  const handleAnimalChange = (e) => {
    setAnimalForm({ ...animalForm, [e.target.name]: e.target.value })
  }

  const adicionarAnimal = () => {
    if (!animalForm.nome.trim() || !animalForm.especie.trim()) {
      setErro('Nome e Espécie do animal são obrigatórios')
      return
    }
    setAnimais([...animais, { ...animalForm }])
    setAnimalForm(ANIMAL_VAZIO)
    setShowAnimalForm(false)
    setErro('')
  }

  const removerAnimal = (index) => {
    setAnimais(animais.filter((_, i) => i !== index))
  }

  const handleSalvar = async () => {
    if (!clienteForm.nome.trim() || !clienteForm.telefone.trim()) {
      setErro('Nome e Telefone do cliente são obrigatórios')
      return
    }

    setSalvando(true)
    setErro('')

    try {
      // 1) Cria o cliente
      const resCliente = await axios.post('/api/clientes', clienteForm)
      if (!resCliente.data.sucesso) {
        setErro('Erro ao criar cliente')
        setSalvando(false)
        return
      }

      const novoClienteId = resCliente.data.data?.id

      // 2) Cria cada animal vinculado ao cliente
      for (const animal of animais) {
        await axios.post('/api/pets', { ...animal, clienteId: novoClienteId })
      }

      onSuccess()
      onClose()
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao salvar. Tente novamente.')
    } finally {
      setSalvando(false)
    }
  }

  // Fecha ao clicar fora do modal
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  return createPortal(
    <div className="ncm-overlay" onClick={handleOverlayClick}>
      <div className="ncm-modal">
        {/* HEADER */}
        <div className="ncm-header">
          <h2>👤 Novo Cliente</h2>
        </div>

        {/* BODY */}
        <div className="ncm-body">
          {erro && <div className="ncm-error">⚠️ {erro}</div>}

          {/* DADOS DO CLIENTE */}
          <div className="ncm-section">
            <h3 className="ncm-section-title">📋 Dados do Cliente</h3>

            <div className="ncm-row">
              <div className="ncm-group">
                <label>Nome *</label>
                <input
                  type="text"
                  name="nome"
                  placeholder="Nome completo"
                  value={clienteForm.nome}
                  onChange={handleClienteChange}
                />
              </div>
              <div className="ncm-group">
                <label>Telefone *</label>
                <input
                  type="tel"
                  name="telefone"
                  placeholder="(00) 00000-0000"
                  value={clienteForm.telefone}
                  onChange={handleClienteChange}
                />
              </div>
            </div>

            <div className="ncm-row">
              <div className="ncm-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  placeholder="email@exemplo.com"
                  value={clienteForm.email}
                  onChange={handleClienteChange}
                />
              </div>
              <div className="ncm-group">
                <label>CPF</label>
                <input
                  type="text"
                  name="cpf"
                  placeholder="000.000.000-00"
                  value={clienteForm.cpf}
                  onChange={handleClienteChange}
                />
              </div>
            </div>

            <div className="ncm-row single">
              <div className="ncm-group">
                <label>Endereço</label>
                <input
                  type="text"
                  name="endereco"
                  placeholder="Rua, número, bairro"
                  value={clienteForm.endereco}
                  onChange={handleClienteChange}
                />
              </div>
            </div>

            <div className="ncm-row">
              <div className="ncm-group">
                <label>Cidade</label>
                <input
                  type="text"
                  name="cidade"
                  placeholder="Cidade"
                  value={clienteForm.cidade}
                  onChange={handleClienteChange}
                />
              </div>
              <div className="ncm-group">
                <label>Estado</label>
                <input
                  type="text"
                  name="estado"
                  placeholder="SP"
                  maxLength="2"
                  value={clienteForm.estado}
                  onChange={handleClienteChange}
                />
              </div>
            </div>
          </div>

          {/* ANIMAIS */}
          <div className="ncm-section">
            <h3 className="ncm-section-title">🐾 Animais</h3>

            {/* Lista de animais já adicionados */}
            {animais.length > 0 && (
              <div className="ncm-animais-list">
                {animais.map((animal, index) => (
                  <div key={index} className="ncm-animal-card">
                    <div className="ncm-animal-card-info">
                      <p>🐾 {animal.nome} ({animal.especie})</p>
                      <p>
                        {[
                          animal.raca && `Raça: ${animal.raca}`,
                          animal.sexo && `Sexo: ${animal.sexo === 'M' ? 'Macho' : 'Fêmea'}`,
                          animal.porte && `Porte: ${animal.porte === 'P' ? 'Pequeno' : animal.porte === 'M' ? 'Médio' : 'Grande'}`,
                          animal.cor && `Cor: ${animal.cor}`
                        ].filter(Boolean).join(' | ') || 'Sem detalhes adicionais'}
                      </p>
                    </div>
                    <button
                      className="ncm-animal-remove"
                      onClick={() => removerAnimal(index)}
                      title="Remover animal"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Formulário inline de animal */}
            {showAnimalForm ? (
              <div className="ncm-animal-form">
                <p className="ncm-animal-form-title">➕ Adicionar Animal</p>

                <div className="ncm-row">
                  <div className="ncm-group">
                    <label>Nome *</label>
                    <input
                      type="text"
                      name="nome"
                      placeholder="Nome do animal"
                      value={animalForm.nome}
                      onChange={handleAnimalChange}
                    />
                  </div>
                  <div className="ncm-group">
                    <label>Espécie *</label>
                    <input
                      type="text"
                      name="especie"
                      placeholder="Cão, Gato..."
                      value={animalForm.especie}
                      onChange={handleAnimalChange}
                    />
                  </div>
                </div>

                <div className="ncm-row">
                  <div className="ncm-group">
                    <label>Raça</label>
                    <input
                      type="text"
                      name="raca"
                      placeholder="Raça"
                      value={animalForm.raca}
                      onChange={handleAnimalChange}
                    />
                  </div>
                  <div className="ncm-group">
                    <label>Sexo</label>
                    <select name="sexo" value={animalForm.sexo} onChange={handleAnimalChange}>
                      <option value="">Selecione</option>
                      <option value="M">Macho</option>
                      <option value="F">Fêmea</option>
                    </select>
                  </div>
                </div>

                <div className="ncm-row">
                  <div className="ncm-group">
                    <label>Porte</label>
                    <select name="porte" value={animalForm.porte} onChange={handleAnimalChange}>
                      <option value="">Selecione</option>
                      <option value="P">Pequeno</option>
                      <option value="M">Médio</option>
                      <option value="G">Grande</option>
                    </select>
                  </div>
                  <div className="ncm-group">
                    <label>Idade (anos)</label>
                    <input
                      type="number"
                      name="idade"
                      placeholder="0"
                      min="0"
                      value={animalForm.idade}
                      onChange={handleAnimalChange}
                    />
                  </div>
                </div>

                <div className="ncm-row">
                  <div className="ncm-group">
                    <label>Cor / Pelagem</label>
                    <input
                      type="text"
                      name="cor"
                      placeholder="Cor do pelo"
                      value={animalForm.cor}
                      onChange={handleAnimalChange}
                    />
                  </div>
                  <div className="ncm-group">
                    <label>Microchip</label>
                    <input
                      type="text"
                      name="microchip"
                      placeholder="Número do microchip"
                      value={animalForm.microchip}
                      onChange={handleAnimalChange}
                    />
                  </div>
                </div>

                <div className="ncm-animal-form-actions">
                  <button type="button" className="ncm-btn-confirm-animal" onClick={adicionarAnimal}>
                    ✓ Confirmar Animal
                  </button>
                  <button
                    type="button"
                    className="ncm-btn-cancel-animal"
                    onClick={() => { setShowAnimalForm(false); setAnimalForm(ANIMAL_VAZIO); setErro('') }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className="ncm-add-animal-btn"
                onClick={() => { setShowAnimalForm(true); setErro('') }}
              >
                + Adicionar Animal
              </button>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div className="ncm-footer">
          <button className="ncm-btn-cancelar" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="ncm-btn-salvar"
            onClick={handleSalvar}
            disabled={salvando}
          >
            {salvando ? 'Salvando...' : '✓ Salvar Cliente'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
