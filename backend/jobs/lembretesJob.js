/**
 * Job para verificar agendamentos e enviar lembretes
 * Executa a cada minuto
 */
import schedule from 'node-schedule'
import { Agendamento, Cliente, Pet, Veterinario, Faturamento } from '../models/index.js'

// Antecedências padrão (minutos) caso o vet não tenha configurado nada
const ANTECEDENCIAS_PADRAO = [5, 30]

// Manter em memória quais lembretes já foram enviados
const lembretesEnviados = new Set()

// Cobranças cujo aviso de vencimento já foi enviado hoje (evita repetir a cada execução do dia)
const avisosCobrancaEnviados = new Set()

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

  // Vencimento de cobranças: verificação diária (não precisa de granularidade de minuto)
  schedule.scheduleJob('0 9 * * *', async () => {
    try {
      await verificarCobrancasVencendo(io)
    } catch (err) {
      console.error('[COBRANCA] Erro:', err.message)
    }
  })
  // Roda uma vez também ao iniciar o servidor, pra não depender de esperar até 9h
  verificarCobrancasVencendo(io).catch(err => console.error('[COBRANCA] Erro na verificação inicial:', err.message))

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

    // Antecedências configuradas por veterinário (cache por ciclo de verificação)
    const prefsPorVet = {}
    const getAntecedencias = async (vetId) => {
      if (vetId == null) return ANTECEDENCIAS_PADRAO
      if (!(vetId in prefsPorVet)) {
        try {
          const vet = await Veterinario.findByPk(vetId, { attributes: ['preferenciasNotificacao'] })
          const arr = vet?.preferenciasNotificacao?.antecedenciasAgendamento
          prefsPorVet[vetId] = Array.isArray(arr) && arr.length > 0 ? arr : ANTECEDENCIAS_PADRAO
        } catch {
          prefsPorVet[vetId] = ANTECEDENCIAS_PADRAO
        }
      }
      return prefsPorVet[vetId]
    }

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

      // Antecedências que ESTE vet configurou (ou padrão 5/30)
      const antecedencias = await getAntecedencias(agendamento.veterinarioId)

      // Dispara se a diferença bate (±1min) com alguma antecedência configurada
      const alvo = antecedencias.find(min => Math.abs(diffMinutos - min) <= 1)
      if (alvo != null) {
        console.log(`[LEMBRETE] ✅ ENVIANDO LEMBRETE ${alvo}min para agendamento ${agendamento.id} (vet ${agendamento.veterinarioId})`)
        enviarLembrete(agendamento, io, `${alvo}min`)
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

  // Texto amigável da antecedência (ex: "5min" -> "5 minutos", "1440min" -> "1 dia")
  const minutos = parseInt(tipo) || 0
  let quando = `${minutos} minutos`
  if (minutos >= 1440) { const d = Math.round(minutos / 1440); quando = d === 1 ? '1 dia' : `${d} dias` }
  else if (minutos >= 60) { const h = Math.round(minutos / 60); quando = h === 1 ? '1 hora' : `${h} horas` }
  const mensagem = `🔔 Lembrete: ${cliente} - ${pet} (${tipoAtend}) em ${quando} (às ${agendamento.hora || ''})`

  // Enviar para todos os clientes conectados via WebSocket
  if (io) {
    try {
      const payload = {
        id: agendamento.id,
        // veterinarioId permite ao front descartar lembretes de outro vet
        // (o socket é broadcast; o filtro por dono acontece no cliente)
        veterinarioId: agendamento.veterinarioId,
        titulo: `Lembrete de Consulta`,
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

// Verifica cobranças pendentes com data de vencimento próxima, respeitando a
// preferência de cada vet (avisarVencimentoCobranca / diasAntesVencimento).
async function verificarCobrancasVencendo(io) {
  try {
    console.log('[COBRANCA] Verificando vencimentos...')

    const faturamentos = await Faturamento.findAll({
      where: { status: ['Pendente', 'Parcialmente Pago'] },
      include: [{ model: Cliente, required: false }]
    })

    const pendentesComVencimento = faturamentos.filter(f => f.dataVencimento)
    if (pendentesComVencimento.length === 0) {
      console.log('[COBRANCA] Nenhuma cobrança pendente com data de vencimento definida')
      return
    }

    const hoje = new Date()
    const hojeSemHora = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
    const chaveDia = hojeSemHora.toISOString().split('T')[0]

    const prefsPorVet = {}
    const getPrefs = async (vetId) => {
      if (vetId == null) return { avisar: true, dias: 1 }
      if (!(vetId in prefsPorVet)) {
        try {
          const vet = await Veterinario.findByPk(vetId, { attributes: ['preferenciasNotificacao'] })
          const prefs = vet?.preferenciasNotificacao || {}
          prefsPorVet[vetId] = {
            avisar: prefs.avisarVencimentoCobranca !== false,
            dias: Number.isFinite(prefs.diasAntesVencimento) ? prefs.diasAntesVencimento : 1
          }
        } catch {
          prefsPorVet[vetId] = { avisar: true, dias: 1 }
        }
      }
      return prefsPorVet[vetId]
    }

    for (const fat of pendentesComVencimento) {
      const prefs = await getPrefs(fat.veterinarioId)
      if (!prefs.avisar) continue

      const [ano, mes, dia] = String(fat.dataVencimento).substring(0, 10).split('-').map(Number)
      const dataVenc = new Date(ano, mes - 1, dia)
      const diffDias = Math.round((dataVenc.getTime() - hojeSemHora.getTime()) / 86400000)

      // Avisa quando faltar exatamente X dias configurados, ou já estiver vencida (diffDias <= 0)
      const deveAvisar = diffDias === prefs.dias || diffDias === 0 || diffDias < 0
      if (!deveAvisar) continue

      const chave = `${fat.id}-${chaveDia}`
      if (avisosCobrancaEnviados.has(chave)) continue
      avisosCobrancaEnviados.add(chave)

      enviarAvisoCobranca(fat, diffDias, io)
    }
  } catch (err) {
    console.error('[COBRANCA] Erro ao verificar vencimentos:', err)
  }
}

function enviarAvisoCobranca(faturamento, diffDias, io) {
  const cliente = faturamento.Cliente?.nome || 'Cliente'
  const valor = parseFloat(faturamento.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })

  let quando
  if (diffDias < 0) quando = `venceu há ${Math.abs(diffDias)} dia(s)`
  else if (diffDias === 0) quando = 'vence hoje'
  else quando = `vence em ${diffDias} dia(s)`

  const mensagem = `Cobrança de ${cliente} (R$ ${valor}) ${quando}`
  console.log(`[COBRANCA] Enviando aviso: ${mensagem}`)

  if (io) {
    io.emit('cobrancaVencendo', {
      id: faturamento.id,
      veterinarioId: faturamento.veterinarioId,
      cliente,
      valor: faturamento.valor,
      dataVencimento: faturamento.dataVencimento,
      mensagem,
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

  // Limpa os avisos de cobrança enviados uma vez por dia (à meia-noite)
  schedule.scheduleJob('0 0 * * *', () => {
    console.log('[COBRANCA] Limpando cache de avisos de vencimento enviados...')
    avisosCobrancaEnviados.clear()
  })
}
