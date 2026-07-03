// Utilitário para cálculo de idade de animais em anos + meses + dias

/**
 * Calcula idade detalhada a partir de uma data de nascimento
 * @param {string|Date} dataNascimento - Data de nascimento
 * @returns {{ anos: number, meses: number, dias: number, texto: string }}
 */
export function calcularIdade(dataNascimento) {
  if (!dataNascimento) {
    return { anos: 0, meses: 0, dias: 0, texto: 'Não informada' }
  }

  const nasc = new Date(dataNascimento)
  if (isNaN(nasc.getTime())) {
    return { anos: 0, meses: 0, dias: 0, texto: 'Data inválida' }
  }

  const hoje = new Date()
  let anos = hoje.getFullYear() - nasc.getFullYear()
  let meses = hoje.getMonth() - nasc.getMonth()
  let dias = hoje.getDate() - nasc.getDate()

  // Ajustar dias negativos
  if (dias < 0) {
    meses--
    const ultimoDiaMesAnterior = new Date(hoje.getFullYear(), hoje.getMonth(), 0).getDate()
    dias += ultimoDiaMesAnterior
  }

  // Ajustar meses negativos
  if (meses < 0) {
    anos--
    meses += 12
  }

  // Gerar texto formatado
  let texto = ''
  if (anos > 0) {
    texto = `${anos} ano${anos !== 1 ? 's' : ''}`
    if (meses > 0) texto += ` e ${meses} ${meses === 1 ? 'mês' : 'meses'}`
  } else if (meses > 0) {
    texto = `${meses} ${meses === 1 ? 'mês' : 'meses'}`
    if (dias > 0) texto += ` e ${dias} dia${dias !== 1 ? 's' : ''}`
  } else {
    texto = `${dias} dia${dias !== 1 ? 's' : ''}`
  }

  return { anos, meses, dias, texto }
}

/**
 * Calcula a data de nascimento a partir de anos + dias informados
 * @param {number} anos
 * @param {number} dias
 * @returns {string} data ISO (YYYY-MM-DD)
 */
export function dataNascimentoDeAnosDias(anos, dias) {
  const anosNum = parseInt(anos) || 0
  const diasNum = parseInt(dias) || 0

  if (anosNum === 0 && diasNum === 0) return null

  const hoje = new Date()
  const totalDias = (anosNum * 365) + diasNum
  const dataNasc = new Date(hoje.getTime() - (totalDias * 24 * 60 * 60 * 1000))

  return dataNasc.toISOString().split('T')[0]
}

/**
 * Retorna anos + dias decompostos a partir de uma data de nascimento
 * (útil para preencher campos do form de edição)
 * @param {string|Date} dataNascimento
 * @returns {{ anos: number, dias: number }}
 */
export function decomporIdade(dataNascimento) {
  if (!dataNascimento) return { anos: 0, dias: 0 }

  const { anos, meses, dias } = calcularIdade(dataNascimento)
  // Converter meses em dias aproximadamente (30 dias/mês)
  const diasTotais = (meses * 30) + dias
  return { anos, dias: diasTotais }
}
