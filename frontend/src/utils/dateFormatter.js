// Formatar data sem problemas de timezone
export const formatarData = (dataString) => {
  if (!dataString) return '';

  // Se é uma string ISO, extrair a parte da data sem conversão de timezone
  if (typeof dataString === 'string') {
    const datePart = dataString.split('T')[0] // Formato: YYYY-MM-DD
    const [year, month, day] = datePart.split('-')
    const date = new Date(year, parseInt(month) - 1, parseInt(day))
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  // Se é um objeto Date
  const date = new Date(dataString)
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// Extrair apenas a data (YYYY-MM-DD) sem timezone
export const extrairDataISO = (dataString) => {
  if (!dataString) return '';
  return dataString.split('T')[0]
}

// Formatar data e hora
export const formatarDataHora = (dataString) => {
  if (!dataString) return '';

  const datePart = dataString.split('T')[0]
  const [year, month, day] = datePart.split('-')
  const date = new Date(year, parseInt(month) - 1, parseInt(day))

  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// Formatar data com dia da semana
export const formatarDataComDia = (dataString) => {
  if (!dataString) return '';

  const datePart = dataString.split('T')[0]
  const [year, month, day] = datePart.split('-')
  const date = new Date(year, parseInt(month) - 1, parseInt(day))

  return date.toLocaleDateString('pt-BR', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })
}
