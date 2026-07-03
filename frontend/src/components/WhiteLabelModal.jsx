import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import axios from 'axios'
import './WhiteLabelModal.css'

export default function WhiteLabelModal({ isOpen, onClose }) {
  const [whiteLabel, setWhiteLabel] = useState({
    nomeClinica: '',
    cnpj: '',
    telefone: '',
    email: '',
    endereco: '',
    cidade: '',
    estado: '',
    logomarcaUrl: ''
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [logoFile, setLogoFile] = useState(null)

  useEffect(() => {
    if (isOpen) {
      fetchWhiteLabel()
    }
  }, [isOpen])

  const fetchWhiteLabel = async () => {
    try {
      setLoading(true)
      const res = await axios.get('/api/perfil')
      if (res.data.sucesso && res.data.data) {
        const vet = res.data.data
        let wl
        if (vet.whiteLabel && typeof vet.whiteLabel === 'object') {
          wl = vet.whiteLabel
        } else {
          wl = {
            nomeClinica: vet.nomeClinica || '',
            cnpj: vet.cnpj || '',
            telefone: vet.telefone || '',
            email: vet.email || '',
            endereco: vet.endereco || '',
            cidade: vet.cidade || '',
            estado: vet.estado || '',
            logomarcaUrl: vet.logomarcaUrl || ''
          }
        }
        if (wl.logomarcaUrl && !wl.logomarcaUrl.startsWith('data:')) {
          try {
            const logoRes = await axios.get('/api/perfil/logo-base64')
            if (logoRes.data.sucesso && logoRes.data.data) {
              wl.logomarcaUrl = logoRes.data.data
            }
          } catch (e) {
            console.error('Erro ao buscar logo:', e)
          }
        }
        setWhiteLabel(wl)
      }
    } catch (err) {
      console.error('Erro ao carregar white label:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setWhiteLabel(prev => ({ ...prev, [name]: value }))
  }

  const handleLogoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setLogoFile(file)
      const reader = new FileReader()
      reader.onload = (event) => {
        setWhiteLabel(prev => ({ ...prev, logomarcaUrl: event.target.result }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError('')
      setSuccess('')
      const formData = new FormData()
      formData.append('nomeClinica', whiteLabel.nomeClinica)
      formData.append('cnpj', whiteLabel.cnpj)
      formData.append('telefone', whiteLabel.telefone)
      formData.append('email', whiteLabel.email)
      formData.append('endereco', whiteLabel.endereco)
      formData.append('cidade', whiteLabel.cidade)
      formData.append('estado', whiteLabel.estado)
      if (logoFile) formData.append('logomarca', logoFile)

      const res = await axios.post('/api/perfil/white-label', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      if (res.data.sucesso) {
        setSuccess('Configurações da clínica salvas com sucesso!')
        setLogoFile(null)
        setTimeout(() => {
          setSuccess('')
          onClose()
        }, 1500)
      }
    } catch (err) {
      setError(err.response?.data?.erro || 'Erro ao salvar configurações')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return createPortal(
    <div className="wl-modal-overlay">
      <div className="wl-modal">
        {/* Header */}
        <div className="wl-modal-header">
          <h2>⚙️ Configurar Clínica</h2>
          <button className="wl-btn-close" onClick={onClose}>✕</button>
        </div>

        {/* Messages */}
        {error && <div className="wl-error">{error}</div>}
        {success && <div className="wl-success">{success}</div>}

        {/* Body */}
        {loading ? (
          <div className="wl-loading">Carregando...</div>
        ) : (
          <div className="wl-modal-body">
            {/* Logo */}
            <div className="wl-section">
              <label className="wl-label">📸 Logomarca da Clínica</label>
              <div className="wl-logo-area">
                {whiteLabel.logomarcaUrl && (
                  <img src={whiteLabel.logomarcaUrl} alt="Logo" className="wl-logo-preview" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="wl-file-input"
                />
                <p className="wl-hint">Recomendado: PNG ou JPG, máx. 2MB</p>
              </div>
            </div>

            {/* Nome da Clínica */}
            <div className="wl-section">
              <label className="wl-label">Clínica (Opcional em MAIÚSCULA):</label>
              <input
                type="text"
                name="nomeClinica"
                placeholder="NOME DA CLÍNICA VETERINÁRIA"
                value={whiteLabel.nomeClinica}
                onChange={handleChange}
                className="wl-input"
                style={{ textTransform: 'uppercase' }}
              />
            </div>

            {/* CNPJ */}
            <div className="wl-section">
              <label className="wl-label">CNPJ:</label>
              <input
                type="text"
                name="cnpj"
                placeholder="00.000.000/0001-00"
                value={whiteLabel.cnpj}
                onChange={handleChange}
                className="wl-input"
              />
            </div>

            {/* Telefone e Email */}
            <div className="wl-row">
              <div className="wl-section">
                <label className="wl-label">Telefone:</label>
                <input
                  type="tel"
                  name="telefone"
                  placeholder="(00) 00000-0000"
                  value={whiteLabel.telefone}
                  onChange={handleChange}
                  className="wl-input"
                />
              </div>
              <div className="wl-section">
                <label className="wl-label">Email:</label>
                <input
                  type="email"
                  name="email"
                  placeholder="clinica@email.com"
                  value={whiteLabel.email}
                  onChange={handleChange}
                  className="wl-input"
                />
              </div>
            </div>

            {/* Endereço */}
            <div className="wl-section">
              <label className="wl-label">Endereço:</label>
              <input
                type="text"
                name="endereco"
                placeholder="Rua, Número, Bairro"
                value={whiteLabel.endereco}
                onChange={handleChange}
                className="wl-input"
              />
            </div>

            {/* Cidade e Estado */}
            <div className="wl-row">
              <div className="wl-section wl-flex2">
                <label className="wl-label">Cidade:</label>
                <input
                  type="text"
                  name="cidade"
                  placeholder="Cidade"
                  value={whiteLabel.cidade}
                  onChange={handleChange}
                  className="wl-input"
                />
              </div>
              <div className="wl-section wl-flex1">
                <label className="wl-label">UF:</label>
                <input
                  type="text"
                  name="estado"
                  placeholder="SP"
                  maxLength={2}
                  value={whiteLabel.estado}
                  onChange={handleChange}
                  className="wl-input"
                  style={{ textTransform: 'uppercase' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        {!loading && (
          <div className="wl-modal-footer">
            <button className="wl-btn-cancel" onClick={onClose}>Cancelar</button>
            <button className="wl-btn-save" onClick={handleSave} disabled={saving}>
              {saving ? 'Salvando...' : '💾 Salvar Clínica'}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
