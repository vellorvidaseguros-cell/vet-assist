import { Op } from 'sequelize';
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

export const obterAgendamento = async (req, res) => {
  try {
    const agendamento = await Agendamento.findByPk(req.params.id, {
      include: [
        { model: Pet, required: false },
        { model: Cliente, required: false }
      ]
    });
    if (!agendamento) {
      return res.status(404).json({ sucesso: false, erro: 'Agendamento não encontrado' });
    }

    // Buscar anexos relacionados separadamente (sem depender de association)
    let anexos = [];
    try {
      anexos = await Anexo.findAll({
        where: { agendamentoId: agendamento.id }
      });
    } catch (e) {
      // Se a tabela não existir ou der erro, ignora
    }

    const resultado = agendamento.toJSON();

    // Converter caminhos absolutos para URLs relativas (mesmo que faz em listarPorHistorico)
    resultado.photos = anexos.map(a => {
      let url = a.caminhoArquivo;

      // Se é um caminho absoluto Windows (começa com letra de unidade)
      if (/^[a-zA-Z]:/.test(url)) {
        url = url.replace(/\\/g, '/');
        const idx = url.indexOf('backend/');
        if (idx !== -1) {
          url = '/' + url.substring(idx);
        } else {
          const uploadsIdx = url.indexOf('uploads/');
          if (uploadsIdx !== -1) {
            url = '/backend/' + url.substring(uploadsIdx);
          }
        }
      } else if (url.includes('\\')) {
        // Converter backslashes para forward slashes
        url = url.replace(/\\/g, '/');
        if (!url.startsWith('/')) {
          url = '/' + url;
        }
      }

      // Se ainda não começa com /, adicionar
      if (!url.startsWith('/')) {
        url = '/' + url;
      }

      return {
        id: a.id,
        url: url,
        nome: a.nomeArquivo,
        tipo: a.tipoMidia
      };
    });

    res.json({ sucesso: true, data: resultado });
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

    // Atualizar apenas os campos fornecidos (não copiar tudo do req.body)
    const dadosAtualizacao = {};

    if (status !== undefined) dadosAtualizacao.status = status;
    if (proximoRetorno !== undefined) dadosAtualizacao.proximoRetorno = proximoRetorno;
    if (valor !== undefined) dadosAtualizacao.valor = parseFloat(valor) || 0;
    if (req.body.diagnostico !== undefined) dadosAtualizacao.diagnostico = req.body.diagnostico;
    if (req.body.procedimentos !== undefined) dadosAtualizacao.procedimentos = req.body.procedimentos;
    if (req.body.medicamentos !== undefined) dadosAtualizacao.medicamentos = req.body.medicamentos;
    if (req.body.descricao !== undefined) dadosAtualizacao.descricao = req.body.descricao;
    if (req.body.observacoes !== undefined) dadosAtualizacao.observacoes = req.body.observacoes;

    console.log(`[DEBUG] Atualizando agendamento ${req.params.id} com dados:`, dadosAtualizacao);

    // Usar update estático para evitar problemas de conversão de tipo no campo hora (TIME)
    await Agendamento.update(dadosAtualizacao, { where: { id: req.params.id } });

    // Se status mudou para Concluído, criar histórico e faturamento
    if (status === 'Concluído' && statusAnterior !== 'Concluído') {
      try {
        console.log(`[INFO] Concluindo agendamento ${req.params.id}`);

        // Extrair data de forma segura (evita problemas de timezone e formato)
        const dataRaw = agendamento.data;
        const dataStr = dataRaw instanceof Date
          ? dataRaw.toISOString()
          : String(dataRaw);
        const dataParte = dataStr.substring(0, 10); // 'YYYY-MM-DD'
        const [y, m, d] = dataParte.split('-').map(Number);
        const dataConsulta = new Date(y, m - 1, d, 12, 0, 0); // Meio-dia evita problemas de UTC

        console.log(`[DEBUG] Data da consulta: ${dataParte}`);

        // Buscar histórico existente pelo agendamento (mesmo dia + pet + tipo)
        const dataInicio = new Date(y, m - 1, d, 0, 0, 0);
        const dataFim = new Date(y, m - 1, d, 23, 59, 59);

        let historico = await HistoricoConsulta.findOne({
          where: {
            petId: agendamento.petId,
            tipoAtendimento: agendamento.tipoAtendimento,
            data: { [Op.between]: [dataInicio, dataFim] }
          }
        });

        if (historico) {
          console.log(`[INFO] Histórico existente ID: ${historico.id}, atualizando...`);
          await HistoricoConsulta.update({
            valor: agendamento.valor || 0,
            status: 'Concluído'
          }, { where: { id: historico.id } });
        } else {
          console.log(`[INFO] Criando novo histórico...`);
          historico = await HistoricoConsulta.create({
            petId: agendamento.petId,
            clienteId: agendamento.clienteId,
            data: dataConsulta,
            tipoAtendimento: agendamento.tipoAtendimento || 'Consulta',
            diagnostico: agendamento.diagnostico || '',
            procedimentos: agendamento.procedimentos || '',
            medicamentos: agendamento.medicamentos || '',
            observacoes: agendamento.observacoes || '',
            veterinario: 'Sistema',
            valor: agendamento.valor || 0,
            status: 'Concluído',
            statusPagamento: 'Pendente'
          });
          console.log(`[INFO] Histórico criado ID: ${historico.id}`);
        }

        // Criar faturamento se não existir
        const faturamentoExistente = await Faturamento.findOne({ where: { historicoConsultaId: historico.id } });
        if (!faturamentoExistente) {
          const pet = await Pet.findByPk(agendamento.petId);
          const novoFaturamento = await Faturamento.create({
            historicoConsultaId: historico.id,
            clienteId: agendamento.clienteId,
            valor: agendamento.valor || 0,
            status: 'Pendente',
            descricao: `${agendamento.tipoAtendimento || 'Consulta'} - ${pet?.nome || 'Animal'}`,
            dataEmissao: dataConsulta
          });
          console.log(`[INFO] Faturamento criado ID: ${novoFaturamento.id}`);
        } else {
          console.log(`[INFO] Faturamento já existe ID: ${faturamentoExistente.id}`);
        }

        // Linkar fotos ao histórico
        await Anexo.update(
          { historicoConsultaId: historico.id },
          { where: { agendamentoId: req.params.id, historicoConsultaId: null } }
        );

        res.json({ sucesso: true, mensagem: 'Agendamento concluído! Histórico e fatura criados.', historicoId: historico.id });
      } catch (erroAuto) {
        console.error(`[ERRO CRÍTICO] Erro ao criar histórico/fatura:`, erroAuto.message, erroAuto.stack);
        res.status(500).json({ sucesso: false, erro: `Erro ao concluir agendamento: ${erroAuto.message}` });
      }
    } else {
      res.json({ sucesso: true, mensagem: 'Agendamento atualizado!' });
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
