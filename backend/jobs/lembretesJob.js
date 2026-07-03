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

    console.log(`[LEMBRETE] ⏰ Verificando em ${agora.toLocaleTimeString('pt-BR')}...`)

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

    console.log(`[LEMBRETE] 📋 Total de agendamentos Pendente/Confirmado: ${agendamentos.length}`)

    for (const agendamento of agendamentos) {
      // Converter data para local usando UTC para evitar problema de fuso horário
      // Banco salva "2026-05-18T00:00:00Z" que vira "2026-05-17 21:00:00 GMT-3"
      // Por isso usamos getUTC* para obter o dia correto
      let ano, mes, dia
      if (agendamento.data instanceof Date) {
        ano = agendamento.data.getUTCFullYear()
        mes = agendamento.data.getUTCMonth()
        dia = agendamento.data.getUTCDate()
      } else {
        // String ISO: "2026-05-18" ou "2026-05-18T00:00:00.000Z"
        const partes = agendamento.data.substring(0, 10).split('-').map(Number)
        ano = partes[0]
        mes = partes[1] - 1
        dia = partes[2]
      }

      // Criar data local no timezone do servidor
      const dataAgenda = new Date(ano, mes, dia)

      // Verificar se é hoje ou amanhã
      const ehHoje = dataAgenda.getTime() === hoje.getTime()
      const ehAmanha = dataAgenda.getTime() === amanha.getTime()

      if (!ehHoje && !ehAmanha) {
        continue
      }

      // Extrair hora do agendamento e criar datetime completo
      const [hora, minuto] = (agendamento.hora || '00:00').split(':').map(Number)
      // Usar ano/mes/dia UTC para criar datetime local corretamente
      const dataHora = new Date(ano, mes, dia, hora, minuto, 0, 0)

      // Calcular diferença em minutos
      const diffMinutos = Math.round((dataHora.getTime() - agora.getTime()) / 60000)

      console.log(`[LEMBRETE] ⏱️ Diferença: ${diffMinutos}min (agendado ${dataHora.toLocaleTimeString('pt-BR')}, agora: ${agora.toLocaleTimeString('pt-BR')})`)

      if (diffMinutos >= 4 && diffMinutos <= 6) {
        console.log(`[LEMBRETE] ✅ ENVIANDO LEMBRETE 5min para agendamento ${agendamento.id}`)
        enviarLembrete(agendamento, io)
      } else if (diffMinutos >= 29 && diffMinutos <= 31) {
        console.log(`[LEMBRETE] ✅ ENVIANDO LEMBRETE 30min para agendamento ${agendamento.id}`)
        enviarLembrete(agendamento, io, '30min')
      } else {
        console.log(`[LEMBRETE] ⏭️ Agendamento fora da janela de lembrete (faltam ${diffMinutos}min)`)
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
    console.log(`[LEMBRETE] ⚠️ Lembrete duplicado ignorado: ${chave}`)
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

  // Enviar para todos os clientes conectados via WebSocket
  if (io) {
    try {
      const payload = {
        id: agendamento.id,
        titulo: `Lembrete de Consulta - ${tipo}`,
        body: mensagem,
        cliente,
        pet,
        hora: agendamento.hora,
        tipo: tipo,
        timestamp: new Date().toISOString()
      }

      // Log antes de emitir
      const clientCount = io.engine.clientsCount || Object.keys(io.sockets.sockets).length
      console.log(`[LEMBRETE] 🚀 Emitindo evento (${clientCount} clientes conectados):`)
      console.log(`[LEMBRETE]    ID: ${agendamento.id}, Cliente: ${cliente}, Pet: ${pet}, Tipo: ${tipo}`)

      io.emit('lembrete', payload)
      console.log(`[LEMBRETE] ✅ Evento emitido com sucesso!`)
    } catch (err) {
      console.error(`[LEMBRETE] ❌ Erro ao emitir: ${err.message}`)
    }
  } else {
    console.error(`[LEMBRETE] ❌ IO não inicializado!`)
  }
}

// Limpar lembretes antigos a cada hora
export function startCleanup() {
  schedule.scheduleJob('0 * * * *', () => {
    console.log('[LEMBRETE] Limpando cache de lembretes enviados...')
    lembretesEnviados.clear()
  })
}
