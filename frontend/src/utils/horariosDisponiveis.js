/**
 * Gera lista de horários disponíveis de 30 em 30 minutos
 * Padrão de clínica veterinária: 06:00 até 22:00
 */
export function gerarHorarios(inicio = 6, fim = 22) {
  const horarios = []
  for (let h = inicio; h <= fim; h++) {
    horarios.push(`${String(h).padStart(2, '0')}:00`)
    if (h < fim) {
      horarios.push(`${String(h).padStart(2, '0')}:30`)
    }
  }
  return horarios
}

export const HORARIOS = gerarHorarios()
