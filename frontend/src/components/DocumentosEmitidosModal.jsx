import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import axios from 'axios'
import { Receipt, DollarSign, Loader2, FileText, Trash2 } from 'lucide-react'
import ConfirmModal from './ConfirmModal'
import './EstoqueInsumosModal.css'

const formatarValor = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(v) || 0)

const formatarDataHora = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.toLocaleDateString('pt-BR')} às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
}

export default function DocumentosEmitidosModal({ isOpen, onClose }) {
  const [documentos, setDocumentos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [gerando, setGerando] = useState(null)
  const [confirm, setConfirm] = useState({ open: false })

  useEffect(() => {
    if (isOpen) fetchDocumentos()
  }, [isOpen])

  const fetchDocumentos = async () => {
    try {
      setLoading(true)
      const res = await axios.get('/api/documentos')
      if (res.data.sucesso) setDocumentos(res.data.data || [])
    } catch (err) {
      setError('Erro ao carregar documentos')
    } finally {
      setLoading(false)
    }
  }

  // Re-gera o PDF a partir dos dados salvos (abre janela antes do await — regra mobile)
  const regerarPDF = async (doc) => {
    setGerando(doc.id)
    const novaJanela = window.open('', '_blank')
    try {
      const dados = typeof doc.dados === 'string' ? JSON.parse(doc.dados) : doc.dados
      const res = await axios.post('/api/orcamento/pdf', dados, { responseType: 'blob' })
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      if (novaJanela) {
        novaJanela.location = url
      } else {
        const a = document.createElement('a')
        a.href = url
        a.download = `${doc.numero || 'orcamento'}.pdf`
        a.click()
      }
      setTimeout(() => URL.revokeObjectURL(url), 10000)
    } catch (err) {
      if (novaJanela) novaJanela.close()
      setError('Erro ao gerar o PDF do documento')
    } finally {
      setGerando(null)
    }
  }

  const removerDocumento = (doc) => {
    setConfirm({
      open: true,
      title: 'Remover Documento',
      message: `Remover o ${doc.tipo === 'cobranca' ? 'documento de cobrança' : 'orçamento'} de ${doc.clienteNome || 'cliente'}?`,
      confirmText: 'Remover',
      cancelText: 'Cancelar',
      confirmColor: 'danger',
      onConfirm: async () => {
        try {
          await axios.delete(`/api/documentos/${doc.id}`)
          await fetchDocumentos()
        } catch {
          setError('Erro ao remover documento')
        } finally {
          setConfirm({ open: false })
        }
      },
      onCancel: () => setConfirm({ open: false })
    })
  }

  if (!isOpen) return null

  return createPortal(
    <div className="ei-modal-overlay">
      <div className="ei-modal">
        <div className="ei-modal-header">
          <h2>Documentos Emitidos</h2>
          <button className="ei-btn-close" onClick={onClose}>✕</button>
        </div>

        <div className="ei-modal-body">
          {error && <div className="ei-error">{error}</div>}

          <p className="ei-description">
            Orçamentos e cobranças que você salvou, com a data de emissão. Toque em um documento para gerar o PDF novamente.
          </p>

          {loading ? (
            <p className="ei-vazio">Carregando...</p>
          ) : documentos.length === 0 ? (
            <p className="ei-vazio">Nenhum documento salvo ainda.</p>
          ) : (
            <div className="ei-lista">
              {documentos.map(doc => (
                <div key={doc.id} className="ei-item">
                  <div className="ei-item-info">
                    <span className="ei-item-nome">
                      {doc.tipo === 'cobranca' ? <DollarSign size={14} /> : <Receipt size={14} />} {doc.clienteNome || 'Cliente'}
                      {doc.petNome ? ` · ${doc.petNome}` : ''}
                    </span>
                    <span className="ei-item-detalhes">
                      {formatarValor(doc.total)} · emitido em {formatarDataHora(doc.createdAt)}
                    </span>
                  </div>
                  <div className="ei-item-acoes">
                    <button
                      className="ei-btn-icon"
                      onClick={() => regerarPDF(doc)}
                      disabled={gerando === doc.id}
                      title="Gerar PDF novamente"
                    >
                      {gerando === doc.id ? <Loader2 size={16} className="spin" /> : <FileText size={16} />}
                    </button>
                    <button
                      className="ei-btn-icon"
                      onClick={() => removerDocumento(doc)}
                      title="Remover"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <ConfirmModal {...confirm} />
    </div>,
    document.body
  )
}
