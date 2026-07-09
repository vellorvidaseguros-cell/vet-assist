import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Clock, CircleCheck, X, RotateCw, Check } from 'lucide-react'
import ConfirmModal from './ConfirmModal'
import './StatusMenu.css'

const STATUS_OPTIONS = [
  { value: 'Pendente', label: 'PENDENTE', icon: Clock, color: 'pendente' },
  { value: 'Concluído', label: 'CONCLUÍDO', icon: CircleCheck, color: 'concluido' },
  { value: 'Cancelado', label: 'CANCELADO', icon: X, color: 'cancelado' },
  { value: 'Reagendado', label: 'REAGENDADO', icon: RotateCw, color: 'reagendado' }
]

export default function StatusMenu({ currentStatus, onStatusChange, agendamentoId }) {
  const [isOpen, setIsOpen] = useState(false)
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 })
  const [confirm, setConfirm] = useState({ open: false })
  const menuRef = useRef(null)
  const buttonRef = useRef(null)
  const portalRef = useRef(null)
  const isProcessingRef = useRef(false)

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Verifica se clicou no menu ou no Portal (dropdown)
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        portalRef.current &&
        !portalRef.current.contains(event.target)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setDropdownPos({
        top: rect.bottom + 4,
        left: rect.left
      })
    }
  }, [isOpen])

  const handleButtonClick = () => {
    setIsOpen(!isOpen)
  }

  const currentOption = STATUS_OPTIONS.find(opt => opt.value === currentStatus) || STATUS_OPTIONS[0]

  const handleStatusSelect = (status) => {
    // Previne múltiplos cliques
    if (isProcessingRef.current) return

    if (status !== currentStatus) {
      setConfirm({
        open: true,
        title: 'Alterar Status',
        message: `Tem certeza que deseja marcar como ${status}?`,
        confirmText: 'Confirmar',
        cancelText: 'Cancelar',
        confirmColor: 'primary',
        onConfirm: async () => {
          isProcessingRef.current = true
          onStatusChange(agendamentoId, status)
          // Reseta após 500ms
          setTimeout(() => {
            isProcessingRef.current = false
            setConfirm({ open: false })
          }, 500)
        },
        onCancel: () => setConfirm({ open: false })
      })
    }
    setIsOpen(false)
  }

  return (
    <>
      <div ref={menuRef} className="status-menu-container">
        <button
          ref={buttonRef}
          className={`status-menu-btn ${currentOption.color}`}
          onClick={handleButtonClick}
        >
          <span className="status-icon"><currentOption.icon size={14} /></span>
          <span className="status-label">{currentOption.label}</span>
        </button>
      </div>

      {isOpen && createPortal(
        <div
          ref={portalRef}
          className="status-dropdown-portal"
          style={{
            position: 'fixed',
            top: `${dropdownPos.top}px`,
            left: `${dropdownPos.left}px`,
            zIndex: 999999
          }}
        >
          <div className="status-dropdown">
            {STATUS_OPTIONS.map(option => (
              <button
                key={option.value}
                className={`status-option ${option.color} ${option.value === currentStatus ? 'active' : ''}`}
                onClick={() => handleStatusSelect(option.value)}
              >
                <span className="option-icon"><option.icon size={16} /></span>
                <span className="option-label">{option.label}</span>
                {option.value === currentStatus && <span className="check-mark"><Check size={16} /></span>}
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}

      <ConfirmModal {...confirm} />
    </>
  )
}
