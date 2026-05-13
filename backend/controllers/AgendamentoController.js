import { Agendamento, Pet, Cliente, HistoricoConsulta, Faturamento, Anexo } from '../models/index.js';

export const listarAgendamentos = async (req, res) => {
  try {
    const agendamentos = await Agendamento.findAll({
      include: [
        { model: Pet, required: false },
        { model: Cliente, required: false }
      ],
      order: [['data', 'ASC'], ['hora', 'ASC']],
      attributes: [
        'id', 'petId', 'clienteId', 'data', 'hora', 'tipoAtendimento',
        'descricao', 'status', 'observacoes', 'valor', 'diagnostico',
        'procedimentos', 'medicamentos', 'proximoRetorno', 'createdAt', 'updatedAt'
      ]
    });
    res.json({ sucesso: true, data: agendamentos });
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: erro.message });
  }
};

export const criarAgendamento = async (req, res) => {
  try {
    const { petId, clienteId, data, hora, tipoAtendimento, descricao, observacoes, valor } = req.body;

    if (!petId || !clienteId || !data || !hora) {
      return res.status(400).json({ sucesso: false, erro: 'PetId, clienteId, data e hora são obrigatórios' });
    }

    const agendamento = await Agendamento.create({
      petId,
      clienteId,
      data,
      hora,
      tipoAtendimento: tipoAtendimento || 'Consulta',
      descricao,
      observacoes,
      valor: valor || 0,
      status: 'Pendente'
    });

    res.status(201).json({ sucesso: true, mensagem: 'Agendamento criado!', data: agendamento });
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: erro.message });
  }
};

export const atualizarAgendamento = async (req, res) => {
  try {
    const agendamento = await Agendamento.findByPk(req.params.id);
    if (!agendamento) return res.status(404).json({ sucesso: false, erro: 'Agendamento não encontrado' });

    const statusAnterior = agendamento.status;
    const proximoRetornoAnterior = agendamento.proximoRetorno;
    const { status, proximoRetorno, valor } = req.body;

    // Atualizar agendamento com os dados fornecidos
    const dadosAtualizacao = { ...req.body };

    // Se valor foi fornecido, garantir que é um número válido
    if (valor !== undefined && valor !== null && valor !== '') {
      dadosAtualizacao.valor = parseFloat(valor) || 0;
    }

    console.log(`[DEBUG] Atualizando agendamento ${req.params.id} com dados:`, dadosAtualizacao);
    await agendamento.update(dadosAtualizacao);

    // Recarregar para ter os dados atualizados
    await agendamento.reload();

    // Se proximoRetorno foi alterado, criar agendamento de retorno
    if (proximoRetorno && (!proximoRetornoAnterior || new Date(proximoRetornoAnterior).getTime() !== new Date(proximoRetorno).getTime())) {
      try {
        const dataRetorno = new Date(proximoRetorno);
        const horaRetorno = dataRetorno.toTimeString().substring(0, 5);

        await Agendamento.create({
          petId: agendamento.petId,
          clienteId: agendamento.clienteId,
          data: proximoRetorno,
          hora: horaRetorno || '10:00',
          tipoAtendimento: `Retorno - ${agendamento.tipoAtendimento || 'Consulta'}`,
          status: 'Pendente',
          observacoes: `Retorno agendado automaticamente de consulta anterior: ${new Date(agendamento.data).toLocaleDateString('pt-BR')}`
        });
        console.log(`[INFO] Agendamento de retorno criado para ${new Date(proximoRetorno).toLocaleDateString('pt-BR')}`);
      } catch (erroRetorno) {
        console.warn('[WARNING] Erro ao criar agendamento de retorno:', erroRetorno.message);
      }
    }

    // Buscar agendamento atualizado para ter os dados de diagnóstico
    const agendamentoAtualizado = await Agendamento.findByPk(req.params.id, { include: [Pet, Cliente] });

    if (status === 'Concluído' && statusAnterior !== 'Concluído') {
      try {
        console.log(`[INFO] Marcando agendamento ${req.params.id} como Concluído`);
        console.log(`[DEBUG] Valor do agendamento: ${agendamentoAtualizado.valor}`);

        // Verificar se já existe HistoricoConsulta para este agendamento
        let historico = await HistoricoConsulta.findOne({
          where: { petId: agendamentoAtualizado.petId, data: agendamentoAtualizado.data, tipoAtendimento: agendamentoAtualizado.tipoAtendimento }
        });

        if (historico) {
          console.log(`[INFO] Histórico existente encontrado (ID: ${historico.id}), atualizando...`);
          // Atualizar histórico existente com diagnóstico e valor
          await historico.update({
            diagnostico: agendamentoAtualizado.diagnostico || historico.diagnostico,
            procedimentos: agendamentoAtualizado.procedimentos || historico.procedimentos,
            medicamentos: agendamentoAtualizado.medicamentos || historico.medicamentos,
            proximoRetorno: agendamentoAtualizado.proximoRetorno || historico.proximoRetorno,
            valor: agendamentoAtualizado.valor || 0,
            status: 'Concluído'
          });
        } else {
          // Criar novo histórico com valor do agendamento
          console.log(`[INFO] Histórico não encontrado, criando novo...`);
          historico = await HistoricoConsulta.create({
            petId: agendamentoAtualizado.petId,
            clienteId: agendamentoAtualizado.clienteId,
            data: agendamentoAtualizado.data,
            tipoAtendimento: agendamentoAtualizado.tipoAtendimento,
            diagnostico: agendamentoAtualizado.diagnostico || '',
            procedimentos: agendamentoAtualizado.procedimentos || '',
            medicamentos: agendamentoAtualizado.medicamentos || '',
            observacoes: agendamentoAtualizado.observacoes || '',
            proximoRetorno: agendamentoAtualizado.proximoRetorno || null,
            veterinario: 'Sistema',
            valor: agendamentoAtualizado.valor || 0,
            status: 'Concluído',
            statusPagamento: 'Pendente'
          });
          console.log(`[INFO] Novo histórico criado com ID: ${historico.id}`);
        }

        // Criar faturamento
        await Faturamento.create({
          historicoConsultaId: historico.id,
          clienteId: agendamentoAtualizado.clienteId,
          valor: agendamentoAtualizado.valor || 0,
          status: 'Pendente',
          descricao: `Faturamento de ${agendamentoAtualizado.tipoAtendimento} para ${agendamentoAtualizado.Pet?.nome || 'animal'}`
        });
        console.log(`[INFO] Faturamento criado para histórico ${historico.id}`);

        // Reanexar TODAS as fotos do agendamento ao histórico (incluindo órfãs)
        const fotosAgendamento = await Anexo.findAll({
          where: { agendamentoId: req.params.id }
        });

        console.log(`[DEBUG] Encontradas ${fotosAgendamento.length} foto(s) para agendamento ${req.params.id}`);

        if (fotosAgendamento.length > 0) {
          let atualizadas = 0;
          for (const foto of fotosAgendamento) {
            // Só atualizar se a foto ainda não está linkada a um histórico
            if (!foto.historicoConsultaId) {
              await foto.update({
                historicoConsultaId: historico.id
              });
              console.log(`[INFO] Foto ${foto.id} (${foto.nomeArquivo}) linkada ao histórico ${historico.id}`);
              atualizadas++;
            } else {
              console.log(`[DEBUG] Foto ${foto.id} já está linkada ao histórico ${foto.historicoConsultaId}`);
            }
          }
          console.log(`[INFO] ✅ ${atualizadas} foto(s) linkada(s), ${fotosAgendamento.length - atualizadas} já linkadas`);
        } else {
          console.log(`[INFO] ℹ️ Nenhuma foto encontrada para linkar ao agendamento ${req.params.id}`);
        }

        // Recarregar agendamento final
        const agendamentoFinal = await Agendamento.findByPk(req.params.id, { include: [Pet, Cliente] });
        console.log(`[DEBUG] Agendamento Concluído - Valor Final: ${agendamentoFinal.valor}`);

        res.json({
          sucesso: true,
          mensagem: 'Agendamento concluído! Histórico, fatura e fotos criados automaticamente.',
          data: agendamentoFinal,
          historicoId: historico.id
        });
      } catch (erroAuto) {
        console.error(`[ERRO] Erro ao criar histórico/fatura:`, erroAuto);
        res.json({
          sucesso: true,
          mensagem: 'Agendamento atualizado, mas houve erro ao criar histórico/fatura automaticamente.',
          data: agendamento,
          aviso: erroAuto.message
        });
      }
    } else {
      // Recarregar agendamento para garantir dados atualizados
      const agendamentoFinal = await Agendamento.findByPk(req.params.id, { include: [Pet, Cliente] });
      console.log(`[DEBUG] Agendamento final - Valor: ${agendamentoFinal.valor}`);
      res.json({ sucesso: true, mensagem: 'Agendamento atualizado!', data: agendamentoFinal });
    }
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: erro.message });
  }
};

export const deletarAgendamento = async (req, res) => {
  try {
    const agendamento = await Agendamento.findByPk(req.params.id);
    if (!agendamento) return res.status(404).json({ sucesso: false, erro: 'Agendamento não encontrado' });

    await agendamento.destroy();
    res.json({ sucesso: true, mensagem: 'Agendamento deletado!' });
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: erro.message });
  }
};
