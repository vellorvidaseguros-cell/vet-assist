/**
 * Job para verificar agendamentos e enviar lembretes
 * Executa a cada minuto
 */
import schedule from 'node-schedule'
import { Agendamento, Cliente, Pet } from '../models/index.js'

// Manter em memória quais lembretes já foram enviados
const lembretesEnviados = new Set()

export function initLembretesJob(io) {
  console.log('🔔 Iniciando job de lembretes...')

  // Executar a cada minuto
  schedule.scheduleJob('* * * * *', async () => {
    try {
      await verificarLembretes(io)
    } catch (err) {
      console.error('[LEMBRETE] Erro:', err.message)
    }
  })

  console.log('✅ Job de lembretes iniciado')
}

async function verificarLembretes(io) {
  try {
    // Buscar agendamentos de hoje/amanhã
    const agora = new Date()
    const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate())
    const amanha = new Date(hoje)
    amanha.setDate(amanha.getDate() + 1)

    // Buscar agendamentos que não foram concluídos
    const agendamentos = await Agendamento.findAll({
      where: {
        status: ['Pendente', 'Confirmado'] // Não enviado lembrete se já concluído
      },
      include: [
        { model: Cliente, required: false },
        { model: Pet, required: false }
      ]
    })

    for (const agendamento of agendamentos) {
      const dataAgenda = new Date(agendamento.data)
      dataAgenda.setHours(0, 0, 0, 0)

      // Verificar se é hoje ou amanhã
      const ehHoje = dataAgenda.getTime() === hoje.getTime()
      const ehAmanha = dataAgenda.getTime() === amanha.getTime()

      if (!ehHoje && !ehAmanha) continue

      // Extrair hora do agendamento
      const [hora, minuto] = (agendamento.hora || '00:00').split(':').map(Number)
      const dataHora = new Date(agendamento.data)
      dataHora.setHours(hora, minuto, 0, 0)

      // Calcular diferença em minutos
      const diffMinutos = Math.round((dataHora.getTime() - agora.getTime()) / 60000)

      // Enviar lembrete 5 minutos antes
      if (diffMinutos >= 4 && diffMinutos <= 6) {
        enviarLembrete(agendamento, io)
      }

      // Enviar lembrete 30 minutos antes (opcional)
      if (diffMinutos >= 29 && diffMinutos <= 31) {
        enviarLembrete(agendamento, io, '30min')
      }
    }
  } catch (err) {
    console.error('[LEMBRETE] Erro ao verificar:', err)
  }
}

function enviarLembrete(agendamento, io, tipo = '5min') {
  const chave = `${agendamento.id}-${tipo}`

  // Evitar duplicatas
  if (lembretesEnviados.has(chave)) {
    return
  }

  lembretesEnviados.add(chave)

  // Limpar após 2 horas (em ms)
  setTimeout(() => {
    lembretesEnviados.delete(chave)
  }, 2 * 60 * 60 * 1000)

  const cliente = agendamento.Cliente?.nome || 'Cliente'
  const pet = agendamento.Pet?.nome || 'Pet'
  const tipoAtend = agendamento.tipoAtendimento || 'Consulta'
  const [hora] = (agendamento.hora || '00:00').split(':')

  let mensagem = ''
  if (tipo === '5min') {
    mensagem = `🔔 Lembrete: ${cliente} - ${pet} (${tipoAtend}) em 5 minutos às ${hora}h`
  } else {
    mensagem = `📬 Próxima consulta: ${cliente} - ${pet} (${tipoAtend}) daqui a 30 minutos`
  }

  console.log(`[LEMBRETE] 📢 ${mensagem}`)

  // Enviar para todos os clientes conectados via WebSocket
  if (io) {
    io.emit('lembrete', {
      id: agendamento.id,
      titulo: `Lembrete de Consulta - ${tipo}`,
      body: mensagem,
      cliente,
      pet,
      hora: agendamento.hora,
      tipo: tipo,
      timestamp: new Date().toISOString()
    })
  }
}

// Limpar lembretes antigos a cada hora
export function startCleanup() {
  schedule.scheduleJob('0 * * * *', () => {
    console.log('[LEMBRETE] Limpando cache de lembretes enviados...')
    lembretesEnviados.clear()
  })
}
