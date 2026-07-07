// Máscara de moeda BR (vírgula + 2 casas decimais), padrão usado em toda a área financeira do app.

// Converte string de input ("150,00" ou "150.00") para número
export function parseValorBR(str) {
  if (str === null || str === undefined || str === '') return null
  const clean = String(str).replace(/[^0-9,.]/g, '').replace(',', '.')
  const num = parseFloat(clean)
  return isNaN(num) ? null : num
}

// Formata número para exibição BR (150 → "150,00")
export function formatarValorBR(value) {
  if (value === null || value === undefined || value === '') return ''
  const num = typeof value === 'string' ? parseValorBR(value) : value
  if (num === null) return ''
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
