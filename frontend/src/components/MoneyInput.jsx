import { useState, useEffect } from 'react'
import { parseInputValue, formatBR } from '../utils/currency'

// Input monetário/decimal padrão BR.
// - Exibe formatado ("6,90") quando não está em foco
// - Ao focar: mostra o número cru para facilitar a edição
// - Ao sair (blur): formata em BR e devolve o NÚMERO via onChangeValue
//
// Props:
//   value          número (ou string numérica) — a fonte de verdade fica no pai
//   onChangeValue  (numeroOuNull) => void  — chamado no blur com o valor parseado
//   placeholder, className, disabled, id
export default function MoneyInput({ value, onChangeValue, placeholder = '0,00', className = '', disabled, id }) {
  const [text, setText] = useState(formatBR(value))
  const [focado, setFocado] = useState(false)

  // Mantém o texto sincronizado quando o valor externo muda e o campo não está em edição
  useEffect(() => {
    if (!focado) setText(formatBR(value))
  }, [value, focado])

  const handleFocus = () => {
    setFocado(true)
    const num = parseInputValue(value)
    setText(num !== null ? String(num) : '')
  }

  const handleBlur = () => {
    setFocado(false)
    const num = parseInputValue(text)
    setText(num !== null ? formatBR(num) : '')
    onChangeValue(num)
  }

  return (
    <input
      id={id}
      type="text"
      inputMode="decimal"
      placeholder={placeholder}
      className={className}
      disabled={disabled}
      value={text}
      onChange={(e) => setText(e.target.value)}
      onFocus={handleFocus}
      onBlur={handleBlur}
    />
  )
}
