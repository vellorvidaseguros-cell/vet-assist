import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import axios from 'axios'
import { API_BASE_URL } from '../utils/apiConfig'
import './PhotoUploadModal.css'

export default function PhotoUploadModal({ historicoId, agendamentoId, onClose, onUploadSuccess }) {
  const [selectedFiles, setSelectedFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [previews, setPreviews] = useState([])
  const [apiStatus, setApiStatus] = useState('checking')

  useEffect(() => {
    checkApiStatus()
  }, [])

  const checkApiStatus = async () => {
    try {
      const response = await axios.get('/api/status', { timeout: 5000 })
      if (response.data) {
        setApiStatus('online')
      }
    } catch (err) {
      console.error('API não está acessível:', err.message)
      setApiStatus('offline')
      setError(`⚠️ Backend não está acessível. Verifique se o servidor está rodando em ${API_BASE_URL}`)
    }
  }

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files)

    // Validar se são imagens
    const validFiles = files.filter(file => {
      return file.type.startsWith('image/') ||
             file.type === 'image/heic' ||
             file.type === 'image/heif' ||
             file.type === 'image/webp'
    })

    if (validFiles.length !== files.length) {
      setError('Alguns arquivos não são imagens válidas')
    }

    setSelectedFiles(validFiles)

    const filePreviews = files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          resolve(reader.result)
        }
        reader.readAsDataURL(file)
      })
    })

    Promise.all(filePreviews).then(results => {
      setPreviews(results)
    })
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const files = Array.from(e.dataTransfer.files)
    handleFileSelect({ target: { files: files } })
  }

  const handleRemoveFile = (index) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index))
    setPreviews(previews.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError('Selecione pelo menos uma imagem')
      return
    }

    if (!historicoId && !agendamentoId) {
      setError('ID de agendamento ou histórico é obrigatório')
      return
    }

    setUploading(true)
    setError('')
    setUploadProgress(0)

    let successCount = 0
    const totalFiles = selectedFiles.length

    for (let i = 0; i < selectedFiles.length; i++) {
      try {
        const formData = new FormData()
        formData.append('arquivo', selectedFiles[i])

        if (historicoId) {
          formData.append('historicoConsultaId', historicoId)
        }
        if (agendamentoId) {
          formData.append('agendamentoId', agendamentoId)
        }

        console.log('Enviando arquivo:', {
          arquivo: selectedFiles[i].name,
          historicoId,
          agendamentoId
        })

        const res = await axios.post('/api/anexos/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          timeout: 60000
        })

        console.log('Resposta:', res.data)

        if (res.data.sucesso) {
          successCount++
        } else {
          throw new Error(res.data.erro || 'Erro desconhecido do servidor')
        }
      } catch (err) {
        console.error(`Erro ao enviar arquivo ${i + 1}:`, err)

        let errorMsg = 'Erro desconhecido'

        if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
          errorMsg = 'Timeout - servidor demorou muito para responder'
        } else if (err.response?.status === 404) {
          errorMsg = 'Rota não encontrada - servidor pode não estar configurado corretamente'
        } else if (err.response?.status === 413) {
          errorMsg = 'Arquivo muito grande (máx 10MB)'
        } else if (err.response?.data?.erro) {
          errorMsg = err.response.data.erro
        } else if (!err.response) {
          errorMsg = 'Sem conexão com o servidor - verifique sua internet ou tente novamente'
        } else if (err.message) {
          errorMsg = err.message
        }

        setError(`Arquivo ${i + 1} - ${errorMsg}`)
      }

      setUploadProgress(Math.round(((i + 1) / totalFiles) * 100))
    }

    setUploading(false)

    if (successCount === totalFiles) {
      setError('')
      setSelectedFiles([])
      setPreviews([])
      if (onUploadSuccess) {
        onUploadSuccess()
      }
      setTimeout(() => onClose(), 500)
    } else if (successCount > 0) {
      setError(`${successCount} de ${totalFiles} arquivos enviados. Verifique os erros acima.`)
    } else {
      setError('Erro ao enviar arquivos. Verifique a conexão e tente novamente.')
    }
  }

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>📸 Enviar Fotos</h3>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {apiStatus === 'offline' && (
          <div className="error-message">
            🔴 <strong>Servidor Backend desligado!</strong><br/>
            Certifique-se de que o backend está rodando em outro terminal com: <code>npm start</code>
          </div>
        )}

        <div
          className="drop-zone"
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          <input
            type="file"
            id="file-input"
            multiple
            accept="image/*,.heic,.heif,.webp"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <label htmlFor="file-input" className="drop-zone-label">
            <div className="drop-zone-icon">📁</div>
            <div>Arraste e solte imagens aqui ou clique para selecionar</div>
            <small>Formatos aceitos: JPEG, PNG, GIF</small>
          </label>
        </div>

        {previews.length > 0 && (
          <div className="preview-section">
            <h4>Pré-visualização ({previews.length})</h4>
            <div className="preview-grid">
              {previews.map((preview, index) => (
                <div key={index} className="preview-item">
                  <img src={preview} alt={`Preview ${index}`} />
                  <button
                    className="btn-remove"
                    onClick={() => handleRemoveFile(index)}
                    title="Remover"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {uploading && (
          <div className="upload-progress">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${uploadProgress}%` }}></div>
            </div>
            <p>{uploadProgress}%</p>
          </div>
        )}

        <div className="modal-actions">
          <button
            className="btn-cancel"
            onClick={onClose}
            disabled={uploading}
          >
            Cancelar
          </button>
          <button
            className="btn-upload"
            onClick={handleUpload}
            disabled={uploading || selectedFiles.length === 0}
          >
            {uploading ? 'Enviando...' : 'Enviar Fotos'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
