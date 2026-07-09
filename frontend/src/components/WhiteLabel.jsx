import { useState, useEffect } from 'react'
import axios from 'axios'
import { apiUrl } from '../utils/apiConfig'
import './WhiteLabel.css'

export default function WhiteLabel() {
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
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [previewTab, setPreviewTab] = useState('protocolo')
  const [logoFile, setLogoFile] = useState(null)

  useEffect(() => {
    fetchWhiteLabel()
  }, [])

  const fetchWhiteLabel = async () => {
    try {
      const res = await axios.get('/api/perfil')
      if (res.data.sucesso && res.data.data) {
        const vet = res.data.data
        let wl

        // Se existe whiteLabel como objeto JSON, usar ele; senão, construir a partir dos campos
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

        // Buscar logo como base64 para preview confiável (sem CORS)
        if (wl.logomarcaUrl && !wl.logomarcaUrl.startsWith('data:')) {
          try {
            const logoRes = await axios.get('/api/perfil/logo-base64')
            if (logoRes.data.sucesso && logoRes.data.data) {
              wl.logomarcaUrl = logoRes.data.data
            }
          } catch (e) {
            console.error('[ERROR] Erro ao buscar logo base64:', e)
          }
        }

        setWhiteLabel(wl)
      }
    } catch (err) {
      console.error('Erro ao carregar white label:', err)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setWhiteLabel(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleLogoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setLogoFile(file)
      // Converter para base64 para preview
      const reader = new FileReader()
      reader.onload = (event) => {
        setWhiteLabel(prev => ({
          ...prev,
          logomarcaUrl: event.target.result
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async () => {
    try {
      setLoading(true)
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

      if (logoFile) {
        formData.append('logomarca', logoFile)
      }

      const res = await axios.post('/api/perfil/white-label', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      if (res.data.sucesso) {
        setSuccess('White Label atualizado com sucesso!')
        setLogoFile(null)
        // Recarregar dados do servidor após salvar
        setTimeout(() => {
          setSuccess('')
          fetchWhiteLabel()
        }, 1000)
      }
    } catch (err) {
      setError(err.response?.data?.erro || 'Erro ao salvar White Label')
    } finally {
      setLoading(false)
    }
  }

  const renderPreview = () => {
    switch (previewTab) {
      case 'protocolo':
        return (
          <div className="pdf-preview">
            <div className="pdf-header">
              <div className="header-left">
                {whiteLabel.logomarcaUrl && (
                  <img src={whiteLabel.logomarcaUrl} alt="Logo" className="pdf-logo" />
                )}
              </div>
              <div className="header-center">
                <h2 className="pdf-titulo">{whiteLabel.nomeClinica || 'NOME DA CLÍNICA'}</h2>
                <p className="pdf-subtitulo">PROTOCOLO DE ATENDIMENTO</p>
              </div>
              <div className="header-right"></div>
            </div>

            <div className="pdf-section">
              <div className="section-title">INFORMAÇÕES DA CLÍNICA</div>
              <div className="info-grid">
                <div className="info-item">
                  <span className="label">Clínica:</span>
                  <span className="value">{whiteLabel.nomeClinica || 'N/A'}</span>
                </div>
                <div className="info-item">
                  <span className="label">CNPJ:</span>
                  <span className="value">{whiteLabel.cnpj || 'N/A'}</span>
                </div>
                <div className="info-item">
                  <span className="label">Telefone:</span>
                  <span className="value">{whiteLabel.telefone || 'N/A'}</span>
                </div>
                <div className="info-item">
                  <span className="label">Email:</span>
                  <span className="value">{whiteLabel.email || 'N/A'}</span>
                </div>
              </div>
              <p className="endereco-info">{whiteLabel.endereco || 'Endereço'}, {whiteLabel.cidade || 'Cidade'} - {whiteLabel.estado || 'UF'}</p>
            </div>

            <div className="pdf-section">
              <div className="section-title">INFORMAÇÕES DO ATENDIMENTO</div>
              <div className="form-grid">
                <div className="form-field">
                  <label>Data:</label>
                  <div className="field-line">____/____/______</div>
                </div>
                <div className="form-field">
                  <label>Hora:</label>
                  <div className="field-line">____:____</div>
                </div>
              </div>
              <div className="form-grid">
                <div className="form-field full-width">
                  <label>Paciente (Animal):</label>
                  <div className="field-line">_________________________________________________________________</div>
                </div>
              </div>
              <div className="form-grid">
                <div className="form-field full-width">
                  <label>Proprietário:</label>
                  <div className="field-line">_________________________________________________________________</div>
                </div>
              </div>
            </div>

            <div className="pdf-section">
              <div className="section-title">DIAGNÓSTICO E OBSERVAÇÕES</div>
              <div className="form-field full-width">
                <label>Diagnóstico:</label>
                <div className="field-box">________________________________________________________________________________________________________________________________________</div>
              </div>
              <div className="form-field full-width">
                <label>Procedimentos Realizados:</label>
                <div className="field-box">________________________________________________________________________________________________________________________________________</div>
              </div>
            </div>

            <div className="pdf-footer">
              <p>________________________</p>
              <p className="footer-text">{whiteLabel.nomeClinica || 'Clínica'}</p>
            </div>
          </div>
        )
      case 'receita':
        return (
          <div className="pdf-preview">
            <div className="pdf-header">
              <div className="header-left">
                {whiteLabel.logomarcaUrl && (
                  <img src={whiteLabel.logomarcaUrl} alt="Logo" className="pdf-logo" />
                )}
              </div>
              <div className="header-center">
                <h2 className="pdf-titulo">{whiteLabel.nomeClinica || 'NOME DA CLÍNICA'}</h2>
                <p className="pdf-subtitulo">RECEITUÁRIO / PRESCRIÇÃO DE MEDICAMENTOS</p>
              </div>
              <div className="header-right"></div>
            </div>

            <div className="pdf-section">
              <div className="info-grid">
                <div className="info-item">
                  <span className="label">Telefone:</span>
                  <span className="value">{whiteLabel.telefone || 'N/A'}</span>
                </div>
                <div className="info-item">
                  <span className="label">Email:</span>
                  <span className="value">{whiteLabel.email || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="pdf-section">
              <div className="form-grid">
                <div className="form-field">
                  <label>Paciente (Animal):</label>
                  <div className="field-line">_________________________________________________________________</div>
                </div>
                <div className="form-field">
                  <label>Proprietário:</label>
                  <div className="field-line">_________________________________________________________________</div>
                </div>
              </div>
              <div className="form-grid">
                <div className="form-field">
                  <label>Data:</label>
                  <div className="field-line">____/____/______</div>
                </div>
              </div>
            </div>

            <div className="pdf-section">
              <div className="section-title">MEDICAMENTOS PRESCRITOS</div>
              <table className="pdf-table">
                <thead>
                  <tr>
                    <th>Medicamento</th>
                    <th>Dosagem</th>
                    <th>Frequência</th>
                    <th>Duração</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>_____________________</td>
                    <td>_____________________</td>
                    <td>_____________________</td>
                    <td>_____________________</td>
                  </tr>
                  <tr>
                    <td>_____________________</td>
                    <td>_____________________</td>
                    <td>_____________________</td>
                    <td>_____________________</td>
                  </tr>
                  <tr>
                    <td>_____________________</td>
                    <td>_____________________</td>
                    <td>_____________________</td>
                    <td>_____________________</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="pdf-section">
              <div className="form-field full-width">
                <label>Observações/Recomendações:</label>
                <div className="field-box">__________________________________________________________________________________________</div>
              </div>
            </div>

            <div className="pdf-footer">
              <p>________________________</p>
              <p className="footer-text">{whiteLabel.nomeClinica || 'Clínica'}</p>
              <p className="footer-date">Data: ____/____/______</p>
            </div>
          </div>
        )
      case 'historico':
        return (
          <div className="pdf-preview">
            <div className="pdf-header">
              <div className="header-left">
                {whiteLabel.logomarcaUrl && (
                  <img src={whiteLabel.logomarcaUrl} alt="Logo" className="pdf-logo" />
                )}
              </div>
              <div className="header-center">
                <h2 className="pdf-titulo">{whiteLabel.nomeClinica || 'NOME DA CLÍNICA'}</h2>
                <p className="pdf-subtitulo">HISTÓRICO CLÍNICO COMPLETO</p>
              </div>
              <div className="header-right"></div>
            </div>

            <div className="pdf-section" style={{ backgroundColor: '#f0f4f8', padding: '1.5rem', borderRadius: '6px', marginBottom: '2rem' }}>
              <div className="info-grid">
                <div className="info-item">
                  <span className="label">Clínica:</span>
                  <span className="value">{whiteLabel.nomeClinica || 'N/A'}</span>
                </div>
                <div className="info-item">
                  <span className="label">CNPJ:</span>
                  <span className="value">{whiteLabel.cnpj || 'N/A'}</span>
                </div>
                <div className="info-item">
                  <span className="label">Telefone:</span>
                  <span className="value">{whiteLabel.telefone || 'N/A'}</span>
                </div>
                <div className="info-item">
                  <span className="label">Email:</span>
                  <span className="value">{whiteLabel.email || 'N/A'}</span>
                </div>
              </div>
              <p className="endereco-info" style={{ marginTop: '1rem' }}>{whiteLabel.endereco || 'Endereço'}, {whiteLabel.cidade || 'Cidade'} - {whiteLabel.estado || 'UF'}</p>
            </div>

            <div className="pdf-section">
              <div className="section-title">INFORMAÇÕES DO PACIENTE</div>
              <div className="form-grid">
                <div className="form-field">
                  <label>Animal:</label>
                  <div className="field-line">_________________________________________________________________</div>
                </div>
                <div className="form-field">
                  <label>Espécie:</label>
                  <div className="field-line">_________________________________________________________________</div>
                </div>
              </div>
              <div className="form-grid">
                <div className="form-field">
                  <label>Proprietário:</label>
                  <div className="field-line">_________________________________________________________________</div>
                </div>
              </div>
              <div className="form-grid">
                <div className="form-field">
                  <label>Período do Relatório:</label>
                  <span>____/____/______ a ____/____/______</span>
                </div>
              </div>
            </div>

            <div className="pdf-section">
              <div className="section-title">CONSULTAS REALIZADAS</div>
              <p style={{ fontStyle: 'italic', color: '#666', textAlign: 'center', padding: '2rem 0' }}>
                Todas as consultas realizadas no período especificado serão listadas abaixo com datas, procedimentos e observações...
              </p>
            </div>

            <div className="pdf-footer">
              <p>________________________</p>
              <p className="footer-text">{whiteLabel.nomeClinica || 'Clínica'}</p>
            </div>
          </div>
        )
      case 'comprovante':
        return (
          <div className="pdf-preview">
            <div className="pdf-header">
              <div className="header-left">
                {whiteLabel.logomarcaUrl && (
                  <img src={whiteLabel.logomarcaUrl} alt="Logo" className="pdf-logo" />
                )}
              </div>
              <div className="header-center">
                <h2 className="pdf-titulo">{whiteLabel.nomeClinica || 'NOME DA CLÍNICA'}</h2>
                <p className="pdf-subtitulo">COMPROVANTE DE PAGAMENTO</p>
              </div>
              <div className="header-right"></div>
            </div>

            <div className="pdf-section">
              <div className="info-grid">
                <div className="info-item">
                  <span className="label">Clínica:</span>
                  <span className="value">{whiteLabel.nomeClinica || 'N/A'}</span>
                </div>
                <div className="info-item">
                  <span className="label">CNPJ:</span>
                  <span className="value">{whiteLabel.cnpj || 'N/A'}</span>
                </div>
                <div className="info-item">
                  <span className="label">Telefone:</span>
                  <span className="value">{whiteLabel.telefone || 'N/A'}</span>
                </div>
                <div className="info-item">
                  <span className="label">Email:</span>
                  <span className="value">{whiteLabel.email || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="pdf-section" style={{ backgroundColor: '#e8f5e9', padding: '2rem', borderRadius: '8px', textAlign: 'center', marginBottom: '2rem', border: '2px solid #2e7d32' }}>
              <h2 style={{ color: '#2e7d32', margin: '0 0 0.5rem 0', fontSize: '1.8rem' }}>PAGAMENTO RECEBIDO</h2>
              <p style={{ color: '#2e7d32', margin: 0, fontSize: '1.1rem', fontWeight: '500' }}>Comprovante de Recebimento</p>
            </div>

            <div className="pdf-section">
              <div className="form-grid">
                <div className="form-field">
                  <label>Paciente (Animal):</label>
                  <div className="field-line">_________________________________________________________________</div>
                </div>
                <div className="form-field">
                  <label>Proprietário:</label>
                  <div className="field-line">_________________________________________________________________</div>
                </div>
              </div>
            </div>

            <div className="pdf-section">
              <div className="form-grid">
                <div className="form-field">
                  <label>Valor Pago:</label>
                  <div className="field-line">R$ _____________________________</div>
                </div>
                <div className="form-field">
                  <label>Data do Pagamento:</label>
                  <div className="field-line">____/____/______</div>
                </div>
              </div>
              <div className="form-grid">
                <div className="form-field full-width">
                  <label>Método de Pagamento:</label>
                  <div className="field-line">_________________________________________________________________</div>
                </div>
              </div>
              <div className="form-grid">
                <div className="form-field full-width">
                  <label>Descrição dos Serviços:</label>
                  <div className="field-box">__________________________________________________________________________________________</div>
                </div>
              </div>
            </div>

            <div className="pdf-footer">
              <p>________________________</p>
              <p className="footer-text">{whiteLabel.nomeClinica || 'Clínica'}</p>
              <p className="footer-date">Data: ____/____/______</p>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="white-label-container">
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="white-label-content">
        {/* Seção Esquerda: Formulário */}
        <div className="white-label-form">
          <h3>Configurar White Label</h3>

          <div className="form-section">
            <label>Logomarca da Clínica</label>
            <div className="logo-upload">
              {whiteLabel.logomarcaUrl && (
                <div className="logo-preview">
                  {whiteLabel.logomarcaUrl.startsWith('data:') ? (
                    <img src={whiteLabel.logomarcaUrl} alt="Logomarca" />
                  ) : (
                    <img src={apiUrl(`/${whiteLabel.logomarcaUrl.replace(/^\/+/, '')}`)} alt="Logomarca" />
                  )}
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="logo-input"
              />
              <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>
                Recomendado: PNG ou JPG, máx. 2MB
              </p>
            </div>
          </div>

          <div className="form-section">
            <label>Clínica (Opcional em MAIÚSCULA):</label>
            <input
              type="text"
              name="nomeClinica"
              value={whiteLabel.nomeClinica}
              onChange={handleChange}
              placeholder="Nome da Clínica Veterinária"
            />
          </div>

          <div className="form-row">
            <div className="form-section">
              <label>CNPJ:</label>
              <input
                type="text"
                name="cnpj"
                value={whiteLabel.cnpj}
                onChange={handleChange}
                placeholder="00.000.000/0000-00"
              />
            </div>
            <div className="form-section">
              <label>Telefone:</label>
              <input
                type="text"
                name="telefone"
                value={whiteLabel.telefone}
                onChange={handleChange}
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>

          <div className="form-section">
            <label>Email:</label>
            <input
              type="email"
              name="email"
              value={whiteLabel.email}
              onChange={handleChange}
              placeholder="email@clinica.com"
            />
          </div>

          <div className="form-section">
            <label>Endereço:</label>
            <input
              type="text"
              name="endereco"
              value={whiteLabel.endereco}
              onChange={handleChange}
              placeholder="Rua, número, complemento"
            />
          </div>

          <div className="form-row">
            <div className="form-section">
              <label>Cidade:</label>
              <input
                type="text"
                name="cidade"
                value={whiteLabel.cidade}
                onChange={handleChange}
                placeholder="São Paulo"
              />
            </div>
            <div className="form-section">
              <label>Estado:</label>
              <input
                type="text"
                name="estado"
                value={whiteLabel.estado}
                onChange={handleChange}
                placeholder="SP"
                maxLength="2"
              />
            </div>
          </div>

          <button
            className="btn-save"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? 'Salvando...' : 'Salvar Configurações'}
          </button>
        </div>

        {/* Seção Direita: Pré-visualização */}
        <div className="white-label-preview">
          <h3>Pré-visualização dos PDFs</h3>

          <div className="preview-tabs">
            <button
              className={`tab ${previewTab === 'protocolo' ? 'active' : ''}`}
              onClick={() => setPreviewTab('protocolo')}
            >
              Protocolo
            </button>
            <button
              className={`tab ${previewTab === 'receita' ? 'active' : ''}`}
              onClick={() => setPreviewTab('receita')}
            >
              Receita
            </button>
            <button
              className={`tab ${previewTab === 'historico' ? 'active' : ''}`}
              onClick={() => setPreviewTab('historico')}
            >
              Histórico
            </button>
            <button
              className={`tab ${previewTab === 'comprovante' ? 'active' : ''}`}
              onClick={() => setPreviewTab('comprovante')}
            >
              Comprovante
            </button>
          </div>

          <div className="preview-container">
            {renderPreview()}
          </div>
        </div>
      </div>
    </div>
  )
}
