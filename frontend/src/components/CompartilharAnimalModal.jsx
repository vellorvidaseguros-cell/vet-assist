import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import axios from 'axios'
import { Trash2 } from 'lucide-react'
import './CompartilharAnimalModal.css'

export default function CompartilharAnimalModal({ isOpen, onClose, animais, onCompartilharSuccess }) {
  const [animalId, setAnimalId] = useState('')
  const [emailVet, setEmailVet] = useState('')
  const [vetExistente, setVetExistente] = useState(null)
  const [permissoes, setPermissoes] = useState(['ver'])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [vetsDisponiveis, setVetsDisponiveis] = useState([])
  const [linkGerado, setLinkGerado] = useState(null)
  const [meusCompartilhamentos, setMeusCompartilhamentos] = useState([])
  const [revogandoId, setRevogandoId] = useState(null)

  useEffect(() => {
    if (isOpen) {
      buscarVets()
      buscarMeusCompartilhamentos()
    }
  }, [isOpen])

  const buscarMeusCompartilhamentos = async () => {
    try {
      const res = await axios.get('/api/compartilhamento/meus')
      if (res.data.sucesso && Array.isArray(res.data.data)) {
        setMeusCompartilhamentos(res.data.data)
      }
    } catch (err) {
      console.error('Erro ao buscar compartilhamentos:', err)
    }
  }

  const handleRevogar = async (comp) => {
    if (!window.confirm(`Remover o acesso ao animal "${comp.Pet?.nome || ''}"?`)) return
    try {
      setRevogandoId(comp.id)
      const res = await axios.delete(
        `/api/compartilhamento/animais/${comp.animalId}/compartilhamentos/${comp.id}`
      )
      if (res.data.sucesso) {
        setMeusCompartilhamentos(prev => prev.filter(c => c.id !== comp.id))
      }
    } catch (err) {
      setError(err.response?.data?.erro || 'Erro ao revogar acesso')
    } finally {
      setRevogandoId(null)
    }
  }

  const buscarVets = async () => {
    try {
      const res = await axios.get('/api/veterinarios')
      if (res.data.sucesso && Array.isArray(res.data.data)) {
        setVetsDisponiveis(res.data.data.filter(v => v.id !== localStorage.getItem('veterinarioId')))
      }
    } catch (err) {
      console.error('Erro ao buscar vets:', err)
    }
  }

  const handleCompartilhar = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!animalId) {
      setError('Selecione um animal')
      return
    }

    if (!emailVet && !vetExistente) {
      setError('Insira um email ou selecione um veterinário existente')
      return
    }

    try {
      setLoading(true)
      const payload = {
        emailConvidado: emailVet || null,
        veterinarioConvidadoId: vetExistente || null,
        permissoes
      }

      const res = await axios.post(
        `/api/compartilhamento/animais/${animalId}/compartilhamentos`,
        payload
      )

      if (res.data.sucesso) {
        setSuccess('Convite gerado!')
        setLinkGerado(res.data.data)
      }
    } catch (err) {
      setError(err.response?.data?.erro || 'Erro ao gerar convite')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return createPortal(
    <div className="ca-modal-overlay">
      <div className="ca-modal">
        {/* Header */}
        <div className="ca-modal-header">
          <h2>Compartilhar Animal</h2>
          <button className="ca-btn-close" onClick={onClose}>✕</button>
        </div>

        {/* Messages */}
        {error && <div className="ca-error">{error}</div>}
        {success && <div className="ca-success">{success}</div>}

        {/* Body */}
        {linkGerado ? (
          <div className="ca-modal-body">
            <div className="ca-link-section">
              <p className="ca-label">Link de Convite Gerado:</p>
              <div className="ca-link-box">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/compartilhamento/${linkGerado.token}`}
                  className="ca-link-input"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `${window.location.origin}/compartilhamento/${linkGerado.token}`
                    )
                    alert('Link copiado!')
                  }}
                  className="ca-btn-copy"
                >
                  Copiar
                </button>
              </div>
              <p className="ca-hint">Compartilhe este link via WhatsApp, email ou mensagem</p>
              <button
                onClick={() => {
                  const link = `${window.location.origin}/compartilhamento/${linkGerado.token}`
                  const texto = encodeURIComponent(
                    `Olá! Sou o veterinário responsável pelo tratamento do seu animal. Clique aqui para acompanhar o histórico de tratamentos: ${link}`
                  )
                  window.open(`https://wa.me/?text=${texto}`, '_blank')
                }}
                className="ca-btn-whatsapp"
              >
                Enviar via WhatsApp
              </button>
              <button
                onClick={() => {
                  onClose()
                  setLinkGerado(null)
                  setAnimalId('')
                  setEmailVet('')
                  setVetExistente(null)
                  setPermissoes(['ver'])
                  onCompartilharSuccess()
                }}
                className="ca-btn-close-after"
              >
                Fechar
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCompartilhar} className="ca-modal-body">
            {/* Animal */}
            <div className="ca-section">
              <label className="ca-label">Animal:</label>
              <select
                value={animalId}
                onChange={(e) => setAnimalId(e.target.value)}
                className="ca-input"
              >
                <option value="">Selecione um animal</option>
                {animais?.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.nome} ({a.especie})
                  </option>
                ))}
              </select>
            </div>

            {/* Veterinário */}
            <div className="ca-section">
              <label className="ca-label">Veterinário a Convidar:</label>
              <div className="ca-vet-options">
                {vetsDisponiveis.length > 0 && (
                  <select
                    value={vetExistente || ''}
                    onChange={(e) => {
                      setVetExistente(e.target.value ? parseInt(e.target.value) : null)
                      setEmailVet('')
                    }}
                    className="ca-input"
                  >
                    <option value="">-- Selecionar vet existente --</option>
                    {vetsDisponiveis.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.nome} ({v.email})
                      </option>
                    ))}
                  </select>
                )}
                <input
                  type="email"
                  placeholder="Ou insira um email"
                  value={emailVet}
                  onChange={(e) => {
                    setEmailVet(e.target.value)
                    setVetExistente(null)
                  }}
                  className="ca-input"
                />
              </div>
            </div>

            {/* Permissões */}
            <div className="ca-section">
              <label className="ca-label">Permissões:</label>
              <div className="ca-permissions">
                <label className="ca-checkbox">
                  <input
                    type="checkbox"
                    checked={permissoes.includes('ver')}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setPermissoes([...permissoes, 'ver'])
                      } else {
                        setPermissoes(permissoes.filter(p => p !== 'ver'))
                      }
                    }}
                  />
                  Ver históricos
                </label>
                <label className="ca-checkbox">
                  <input
                    type="checkbox"
                    checked={permissoes.includes('editar')}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setPermissoes([...permissoes, 'editar'])
                      } else {
                        setPermissoes(permissoes.filter(p => p !== 'editar'))
                      }
                    }}
                  />
                  Editar históricos
                </label>
              </div>
            </div>

            {/* Acessos concedidos */}
            {meusCompartilhamentos.length > 0 && (
              <div className="ca-section">
                <label className="ca-label">Acessos Concedidos:</label>
                <div className="ca-shares-list">
                  {meusCompartilhamentos.map(comp => (
                    <div key={comp.id} className="ca-share-item">
                      <div className="ca-share-info">
                        <span className="ca-share-animal">
                          {comp.Pet?.nome || 'Animal removido'}
                        </span>
                        <span className="ca-share-quem">
                          {comp.veterinarioConvidado
                            ? `${comp.veterinarioConvidado.nome} (${comp.veterinarioConvidado.email})`
                            : comp.emailConvidado || 'Aguardando aceite'}
                        </span>
                        <span className={`ca-share-status ca-share-status-${comp.status}`}>
                          {comp.status === 'aceito' ? 'Aceito' : comp.status === 'pendente' ? '⏳ Pendente' : comp.status}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRevogar(comp)}
                        disabled={revogandoId === comp.id}
                        className="ca-btn-revogar"
                        title="Remover acesso"
                      >
                        {revogandoId === comp.id ? '...' : <Trash2 size={14} />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="ca-modal-footer">
              <button type="button" onClick={onClose} className="ca-btn-cancel">
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="ca-btn-submit"
              >
                {loading ? 'Gerando...' : 'Gerar Convite'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  )
}
