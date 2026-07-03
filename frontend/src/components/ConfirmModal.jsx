import { createPortal } from 'react-dom'
import './ConfirmModal.css'

/**
 * Modal de confirmação reutilizável
 *
 * Uso:
 * const [confirm, setConfirm] = useState({ open: false })
 *
 * // Abrir modal
 * setConfirm({
 *   open: true,
 *   title: 'Confirmar',
 *   message: 'Tem certeza?',
 *   confirmText: 'Sim',
 *   cancelText: 'Não',
 *   onConfirm: () => { ... },
 *   onCancel: () => setConfirm({ open: false })
 * })
 *
 * // Renderizar
 * <ConfirmModal {...confirm} />
 */
export default function ConfirmModal({
  open = false,
  title = 'Confirmação',
  message = '',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  confirmColor = 'danger', // 'danger', 'primary', 'success'
  onConfirm = () => {},
  onCancel = () => {},
  loading = false
}) {
  if (!open) return null

  const handleConfirm = async () => {
    await onConfirm()
  }

  const handleCancel = () => {
    onCancel()
  }

  return createPortal(
    <div className="confirm-modal-overlay" onClick={handleCancel}>
      <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-modal-header">
          <h3>{title}</h3>
        </div>

        <div className="confirm-modal-body">
          <p>{message}</p>
        </div>

        <div className="confirm-modal-footer">
          <button
            className="confirm-modal-btn confirm-modal-btn-cancel"
            onClick={handleCancel}
            disabled={loading}
          >
            {cancelText}
          </button>
          <button
            className={`confirm-modal-btn confirm-modal-btn-${confirmColor}`}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? 'Processando...' : confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
