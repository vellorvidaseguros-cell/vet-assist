import { createPortal } from 'react-dom'
import { useState, useEffect } from 'react'
import './PromptModal.css'

export default function PromptModal({
  open = false,
  title = 'Entrada de Texto',
  message = '',
  initialValue = '',
  placeholderText = '',
  confirmText = 'OK',
  cancelText = 'Cancelar',
  onConfirm = () => {},
  onCancel = () => {}
}) {
  const [value, setValue] = useState(initialValue)

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  if (!open) return null

  const handleConfirm = () => {
    onConfirm(value)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleConfirm()
    } else if (e.key === 'Escape') {
      onCancel()
    }
  }

  return createPortal(
    <div className="prompt-modal-overlay" onClick={onCancel}>
      <div className="prompt-modal" onClick={(e) => e.stopPropagation()}>
        <div className="prompt-modal-header">
          <h3>{title}</h3>
        </div>

        <div className="prompt-modal-body">
          {message && <p>{message}</p>}
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholderText}
            autoFocus
            onKeyPress={handleKeyPress}
            className="prompt-modal-input"
          />
        </div>

        <div className="prompt-modal-footer">
          <button
            className="prompt-modal-btn prompt-modal-btn-cancel"
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button
            className="prompt-modal-btn prompt-modal-btn-confirm"
            onClick={handleConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
