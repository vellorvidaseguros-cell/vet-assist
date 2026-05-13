import { Cliente, Pet, Agendamento, HistoricoConsulta, Faturamento } from './models/index.js'

export const seedTestData = async () => {
  try {
    // Verificar se já existem clientes
    const clienteExistente = await Cliente.findOne({ where: { nome: 'João Silva' } })

    if (clienteExistente) {
      console.log('[INFO] Dados de teste já foram inseridos')
      return
    }

    console.log('[INFO] Inserindo dados de teste...')

    // Criar clientes de teste
    const clientes = await Cliente.bulkCreate([
      {
        veterinarioId: 1,
        nome: 'João Silva',
        email: 'joao@example.com',
        telefone: '(11) 98765-4321',
        cpf: '12345678901',
        endereco: 'Rua A, 123',
        cidade: 'São Paulo',
        estado: 'SP'
      },
      {
        veterinarioId: 1,
        nome: 'Maria Santos',
        email: 'maria@example.com',
        telefone: '(11) 99876-5432',
        cpf: '12345678902',
        endereco: 'Rua B, 456',
        cidade: 'São Paulo',
        estado: 'SP'
      },
      {
        veterinarioId: 1,
        nome: 'Pedro Costa',
        email: 'pedro@example.com',
        telefone: '(11) 97654-3210',
        cpf: '12345678903',
        endereco: 'Rua C, 789',
        cidade: 'São Paulo',
        estado: 'SP'
      },
      {
        veterinarioId: 1,
        nome: 'Ana Oliveira',
        email: 'ana@example.com',
        telefone: '(11) 96543-2109',
        cpf: '12345678904',
        endereco: 'Avenida D, 1011',
        cidade: 'São Paulo',
        estado: 'SP'
      },
      {
        veterinarioId: 1,
        nome: 'Carlos Mendes',
        email: 'carlos@example.com',
        telefone: '(11) 95432-1098',
        cpf: '12345678905',
        endereco: 'Rua E, 1213',
        cidade: 'São Paulo',
        estado: 'SP'
      }
    ])

    // Criar pets de teste
    await Pet.bulkCreate([
      {
        nome: 'Rex',
        especie: 'Cão',
        raca: 'Labrador',
        dataNascimento: new Date('2020-01-15'),
        peso: 32.5,
        clienteId: clientes[0].id
      },
      {
        nome: 'Mimi',
        especie: 'Gato',
        raca: 'Persa',
        dataNascimento: new Date('2019-06-20'),
        peso: 4.2,
        clienteId: clientes[0].id
      },
      {
        nome: 'Max',
        especie: 'Cão',
        raca: 'Pastor Alemão',
        dataNascimento: new Date('2021-03-10'),
        peso: 28.0,
        clienteId: clientes[1].id
      },
      {
        nome: 'Luna',
        especie: 'Gato',
        raca: 'Siamês',
        dataNascimento: new Date('2020-11-05'),
        peso: 3.8,
        clienteId: clientes[1].id
      },
      {
        nome: 'Bella',
        especie: 'Cão',
        raca: 'Golden Retriever',
        dataNascimento: new Date('2019-09-12'),
        peso: 30.5,
        clienteId: clientes[2].id
      },
      {
        nome: 'Thor',
        especie: 'Cão',
        raca: 'Husky',
        dataNascimento: new Date('2021-02-28'),
        peso: 26.0,
        clienteId: clientes[3].id
      },
      {
        nome: 'Whiskers',
        especie: 'Gato',
        raca: 'Maine Coon',
        dataNascimento: new Date('2018-07-18'),
        peso: 6.5,
        clienteId: clientes[4].id
      }
    ])

    // Buscar pets para criar agendamentos
    const pets = await Pet.findAll()

    // Criar agendamentos de teste
    const agora = new Date()
    const amanha = new Date(agora.getTime() + 24 * 60 * 60 * 1000)
    const proximaSemana = new Date(agora.getTime() + 7 * 24 * 60 * 60 * 1000)
    const proxProximaSemana = new Date(agora.getTime() + 14 * 24 * 60 * 60 * 1000)

    const agendamentos = await Agendamento.bulkCreate([
      {
        petId: pets[0].id,
        clienteId: clientes[0].id,
        data: amanha.toISOString().split('T')[0],
        hora: '10:00',
        tipoAtendimento: 'Consulta',
        descricao: 'Consulta de rotina',
        status: 'Pendente',
        valor: 150.00
      },
      {
        petId: pets[1].id,
        clienteId: clientes[0].id,
        data: proximaSemana.toISOString().split('T')[0],
        hora: '14:30',
        tipoAtendimento: 'Vacinação',
        descricao: 'Vacinação anual',
        status: 'Pendente',
        valor: 200.00
      },
      {
        petId: pets[2].id,
        clienteId: clientes[1].id,
        data: proxProximaSemana.toISOString().split('T')[0],
        hora: '11:00',
        tipoAtendimento: 'Banho e Tosa',
        descricao: 'Banho e tosa completos',
        status: 'Pendente',
        valor: 120.00
      }
    ])

    // Criar históricos de consulta concluídos
    const historicos = await HistoricoConsulta.bulkCreate([
      {
        petId: pets[3].id,
        clienteId: clientes[1].id,
        data: new Date('2026-04-20').toISOString(),
        tipoAtendimento: 'Consulta',
        diagnostico: 'Gato saudável, sem complicações',
        procedimentos: 'Palpação abdominal, ausculta',
        medicamentos: 'Nenhum prescrito',
        observacoes: 'Animal em perfeito estado',
        veterinario: 'Dr. João',
        valor: 150.00,
        status: 'Concluído',
        statusPagamento: 'Pago'
      },
      {
        petId: pets[4].id,
        clienteId: clientes[2].id,
        data: new Date('2026-04-15').toISOString(),
        tipoAtendimento: 'Vacinação',
        diagnostico: 'Aplicação de vacina antirrábica',
        procedimentos: 'Injeção intramuscular',
        medicamentos: 'Vacina antirrábica',
        observacoes: 'Vacinação realizada com sucesso',
        veterinario: 'Dra. Maria',
        valor: 200.00,
        status: 'Concluído',
        statusPagamento: 'Pago'
      },
      {
        petId: pets[5].id,
        clienteId: clientes[3].id,
        data: new Date('2026-04-10').toISOString(),
        tipoAtendimento: 'Consulta',
        diagnostico: 'Inflamação leve nas orelhas',
        procedimentos: 'Limpeza das orelhas, coleta de amostra',
        medicamentos: 'Otocilina gotas, Anti-inflamatório',
        observacoes: 'Retorno em 1 semana para reavaliação',
        veterinario: 'Dr. Carlos',
        valor: 180.00,
        status: 'Concluído',
        statusPagamento: 'Pendente'
      }
    ])

    // Criar faturamentos para históricos
    await Faturamento.bulkCreate([
      {
        historicoConsultaId: historicos[0].id,
        clienteId: clientes[1].id,
        valor: 150.00,
        status: 'Pago',
        descricao: 'Consulta veterinária - Luna'
      },
      {
        historicoConsultaId: historicos[1].id,
        clienteId: clientes[2].id,
        valor: 200.00,
        status: 'Pago',
        descricao: 'Vacinação - Bella'
      },
      {
        historicoConsultaId: historicos[2].id,
        clienteId: clientes[3].id,
        valor: 180.00,
        status: 'Pendente',
        descricao: 'Consulta veterinária - Thor'
      }
    ])

    console.log(`[OK] ${clientes.length} clientes criados!`)
    console.log('[OK] 7 pets criados!')
    console.log(`[OK] ${agendamentos.length} agendamentos criados!`)
    console.log(`[OK] ${historicos.length} históricos criados!`)
    console.log('[OK] 3 faturamentos criados!')
    console.log('[INFO] Dados de teste inseridos com sucesso!')

  } catch (erro) {
    console.error('[ERROR] Erro ao inserir dados de teste:', erro.message)
    if (erro.errors) {
      console.error('[ERROR] Detalhes:', erro.errors.map(e => e.message).join(', '))
    }
    console.error('[DEBUG] Stack:', erro.stack)
  }
}
