// Utilitários de moeda/decimais no padrão brasileiro (vírgula decimal).
// Usados pelos inputs monetários em todo o app.

// Converte texto digitado ("6,90" ou "6.90" ou "1.234,56") em número.
// Aceita vírgula OU ponto como separador decimal.
export const parseInputValue = (str) => {
  if (str === null || str === undefined || str === '') return null
  if (typeof str === 'number') return isNaN(str) ? null : str
  // Remove tudo que não for dígito, vírgula ou ponto
  let clean = String(str).replace(/[^0-9,\.]/g, '')
  if (!clean) return null
  // Se tem vírgula, ela é o separador decimal → pontos são milhar
  if (clean.includes(',')) {
    clean = clean.replace(/\./g, '').replace(',', '.')
  }
  const num = parseFloat(clean)
  return isNaN(num) ? null : num
}

// Formata número para exibição BR: 6.9 → "6,90"
export const formatBR = (value) => {
  if (value === null || value === undefined || value === '') return ''
  const num = typeof value === 'string' ? parseInputValue(value) : value
  if (num === null || num === undefined || isNaN(num)) return ''
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
