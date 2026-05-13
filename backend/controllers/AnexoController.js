import { Anexo, Agendamento, HistoricoConsulta, Pet } from '../models/index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Função auxiliar para reanexar fotos a um histórico
const reanexarFotosAoHistorico = async (agendamentoId, historicoId) => {
  try {
    const fotos = await Anexo.findAll({
      where: { agendamentoId: agendamentoId, historicoConsultaId: null }
    });

    if (fotos.length > 0) {
      for (const foto of fotos) {
        await foto.update({
          historicoConsultaId: historicoId
        });
        console.log(`[INFO] Foto ${foto.id} reanexada ao histórico ${historicoId}`);
      }
      console.log(`[INFO] ✅ ${fotos.length} foto(s) reanexada(s) ao histórico ${historicoId}`);
    }
  } catch (erro) {
    console.error('[ERROR] Erro ao reanexar fotos:', erro.message);
  }
};

export const uploadArquivo = async (req, res) => {
  try {
    console.log('[INFO] Iniciando upload de arquivo');
    console.log('[DEBUG] req.file:', req.file ? `${req.file.originalname} (${req.file.size} bytes)` : 'NENHUM');
    console.log('[DEBUG] req.body:', req.body);

    if (!req.file) {
      return res.status(400).json({
        sucesso: false,
        erro: 'Nenhum arquivo foi enviado. Verifique se está enviando uma imagem válida.'
      });
    }

    const { agendamentoId, historicoConsultaId, descricao } = req.body;

    console.log('[DEBUG] IDs recebidos:', { agendamentoId, historicoConsultaId });

    if (!agendamentoId && !historicoConsultaId) {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        sucesso: false,
        erro: 'agendamentoId ou historicoConsultaId é obrigatório'
      });
    }

    // Converter caminho absoluto para caminho relativo (URL)
    // Funciona em Windows e Linux normalizando os separadores
    const pathNormalizado = req.file.path.replace(/\\/g, '/');
    let caminhoRelativo;
    const idxBackend = pathNormalizado.indexOf('backend/');
    if (idxBackend >= 0) {
      caminhoRelativo = pathNormalizado.substring(idxBackend + 'backend/'.length);
    } else if (pathNormalizado.includes('uploads/')) {
      // Fallback: pegar tudo a partir de uploads/
      caminhoRelativo = pathNormalizado.substring(pathNormalizado.indexOf('uploads/'));
    } else {
      // Último fallback: apenas o nome do arquivo
      caminhoRelativo = `uploads/${req.file.filename || pathNormalizado.split('/').pop()}`;
    }

    let finalHistoricoConsultaId = historicoConsultaId ? parseInt(historicoConsultaId) : null;

    // Se agendamentoId foi passado mas sem historicoConsultaId, tentar encontrar o histórico
    if (agendamentoId && !finalHistoricoConsultaId) {
      try {
        const agendamento = await Agendamento.findByPk(agendamentoId);
        if (agendamento) {
          console.log(`[DEBUG] Buscando histórico para agendamento ${agendamentoId}...`);

          // Procurar histórico pelo petId, data e tipoAtendimento
          const historico = await HistoricoConsulta.findOne({
            where: {
              petId: agendamento.petId,
              data: agendamento.data,
              tipoAtendimento: agendamento.tipoAtendimento
            }
          });

          if (historico) {
            console.log(`[INFO] Histórico encontrado (ID: ${historico.id}) para agendamento ${agendamentoId}`);
            finalHistoricoConsultaId = historico.id;
          } else {
            console.log(`[DEBUG] Nenhum histórico encontrado para agendamento ${agendamentoId}`);
          }
        }
      } catch (erro) {
        console.warn('[WARNING] Erro ao procurar histórico:', erro.message);
      }
    }

    const anexo = await Anexo.create({
      agendamentoId: agendamentoId ? parseInt(agendamentoId) : null,
      historicoConsultaId: finalHistoricoConsultaId,
      nomeArquivo: req.file.originalname,
      caminhoArquivo: `backend/${caminhoRelativo}`,
      tipoMidia: req.file.mimetype,
      descricao: descricao || null
    });

    console.log('[INFO] Arquivo salvo com sucesso:', anexo.id);
    console.log(`[DEBUG] Anexo criado - agendamentoId: ${anexo.agendamentoId}, historicoConsultaId: ${anexo.historicoConsultaId}`);

    res.status(201).json({
      sucesso: true,
      mensagem: 'Arquivo enviado com sucesso!',
      data: anexo
    });
  } catch (erro) {
    console.error('[ERRO] Erro ao fazer upload:', erro);

    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.error('[ERRO] Falha ao deletar arquivo:', err);
      }
    }

    res.status(500).json({
      sucesso: false,
      erro: erro.message || 'Erro ao fazer upload do arquivo'
    });
  }
};

export const listarPorHistorico = async (req, res) => {
  try {
    const { historicoId } = req.params;

    const anexos = await Anexo.findAll({
      where: { historicoConsultaId: historicoId },
      order: [['createdAt', 'ASC']]
    });

    // Converter caminhos absolutos para URLs relativas
    const anexosComUrl = anexos.map(anexo => {
      let url = anexo.caminhoArquivo;

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
        ...anexo.toJSON(),
        caminhoArquivo: url
      };
    });

    res.json({
      sucesso: true,
      data: anexosComUrl
    });
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: erro.message });
  }
};

export const listarPorAgendamento = async (req, res) => {
  try {
    const { agendamentoId } = req.params;

    const anexos = await Anexo.findAll({
      where: { agendamentoId },
      order: [['createdAt', 'ASC']]
    });

    // Converter caminhos absolutos para URLs relativas
    const anexosComUrl = anexos.map(anexo => {
      let url = anexo.caminhoArquivo;

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
        ...anexo.toJSON(),
        caminhoArquivo: url
      };
    });

    res.json({
      sucesso: true,
      data: anexosComUrl
    });
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: erro.message });
  }
};

export const deletarArquivo = async (req, res) => {
  try {
    const { id } = req.params;

    const anexo = await Anexo.findByPk(id);
    if (!anexo) {
      return res.status(404).json({ sucesso: false, erro: 'Arquivo não encontrado' });
    }

    if (fs.existsSync(anexo.caminhoArquivo)) {
      fs.unlinkSync(anexo.caminhoArquivo);
    }

    await anexo.destroy();

    res.json({
      sucesso: true,
      mensagem: 'Arquivo deletado com sucesso!'
    });
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: erro.message });
  }
};

export const obterArquivo = async (req, res) => {
  try {
    const { id } = req.params;

    const anexo = await Anexo.findByPk(id);
    if (!anexo) {
      return res.status(404).json({ sucesso: false, erro: 'Arquivo não encontrado' });
    }

    // Tentar encontrar o arquivo - pode ser caminho absoluto ou relativo
    let caminhoReal = anexo.caminhoArquivo;

    // Se é um caminho relativo (começa com backend/ ou uploads/), construir caminho absoluto
    if (!path.isAbsolute(caminhoReal)) {
      caminhoReal = path.join(path.dirname(__filename), '../', caminhoReal);
    }

    // Normalizar o caminho
    caminhoReal = path.normalize(caminhoReal);

    if (!fs.existsSync(caminhoReal)) {
      return res.status(404).json({ sucesso: false, erro: 'Arquivo não existe no servidor: ' + caminhoReal });
    }

    res.download(caminhoReal, anexo.nomeArquivo);
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: erro.message });
  }
};

// Endpoint para servir a imagem diretamente (sem express.static)
export const obterFotoFile = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[DEBUG] Requisição de foto: ID=${id}`);

    const anexo = await Anexo.findByPk(id);
    if (!anexo) {
      console.error(`[ERROR] Anexo com ID ${id} não encontrado no banco`);
      return res.status(404).json({ sucesso: false, erro: 'Arquivo não encontrado' });
    }

    console.log(`[DEBUG] Anexo encontrado:`, { id: anexo.id, nomeArquivo: anexo.nomeArquivo, caminhoArquivo: anexo.caminhoArquivo });

    // Tentar encontrar o arquivo
    let caminhoReal = anexo.caminhoArquivo;

    // Se o caminho começa com "backend/", remover porque será adicionado relativo ao diretório
    if (caminhoReal.startsWith('backend/')) {
      caminhoReal = caminhoReal.substring(8); // Remove "backend/"
    }

    // Se é um caminho relativo, construir caminho absoluto
    if (!path.isAbsolute(caminhoReal)) {
      caminhoReal = path.join(path.dirname(__filename), '../', caminhoReal);
    }

    // Normalizar o caminho
    caminhoReal = path.normalize(caminhoReal);

    console.log(`[DEBUG] Caminho real resolvido:`, caminhoReal);

    // Verificar se arquivo existe
    if (!fs.existsSync(caminhoReal)) {
      console.error(`[ERROR] Arquivo não encontrado em: ${caminhoReal}`);

      // Tentar caminho alternativo (em caso de Windows absolute path)
      const caminhoAlt = path.normalize(anexo.caminhoArquivo.replace(/\\/g, path.sep));
      if (fs.existsSync(caminhoAlt)) {
        console.log(`[INFO] Arquivo encontrado em caminho alternativo: ${caminhoAlt}`);
        caminhoReal = caminhoAlt;
      } else {
        return res.status(404).json({ sucesso: false, erro: 'Arquivo não existe no servidor: ' + caminhoReal });
      }
    }

    console.log(`[INFO] Servindo arquivo: ${caminhoReal}`);

    // Servir o arquivo
    res.setHeader('Content-Type', anexo.tipoMidia || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.sendFile(caminhoReal);
  } catch (erro) {
    console.error('[ERROR] Erro ao servir foto:', erro);
    res.status(500).json({ sucesso: false, erro: erro.message });
  }
};

// Novo endpoint para servir foto como resposta JSON com URL ou base64
export const obterFotoUrl = async (req, res) => {
  try {
    const { id } = req.params;

    const anexo = await Anexo.findByPk(id);
    if (!anexo) {
      return res.status(404).json({ sucesso: false, erro: 'Arquivo não encontrado' });
    }

    // Converter caminho para URL relativa
    let url = anexo.caminhoArquivo;

    // Se é um caminho absoluto Windows
    if (url.includes('\\')) {
      url = url.replace(/\\/g, '/');
      const idx = url.indexOf('backend/');
      if (idx !== -1) {
        url = '/' + url.substring(idx);
      }
    }

    // Se não começa com /, adicionar
    if (!url.startsWith('/')) {
      url = '/' + url;
    }

    res.json({ sucesso: true, data: { url, nomeArquivo: anexo.nomeArquivo } });
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: erro.message });
  }
};

// Debug: listar todos os anexos (temporário)
export const listarTodosAnexos = async (req, res) => {
  try {
    const anexos = await Anexo.findAll();
    res.json({ sucesso: true, count: anexos.length, data: anexos });
  } catch (erro) {
    res.status(500).json({ sucesso: false, erro: erro.message });
  }
};

// Limpar fotos orphans (sem histórico) e detectar duplicatas
export const limparFotosOrphans = async (req, res) => {
  try {
    console.log('[INFO] Iniciando limpeza de fotos órfãs...');

    // Encontrar fotos sem historicoConsultaId
    const fotosOrphans = await Anexo.findAll({
      where: { historicoConsultaId: null },
      order: [['createdAt', 'ASC']]
    });

    console.log(`[DEBUG] Encontradas ${fotosOrphans.length} foto(s) órfã(s)`);

    let linked = 0;
    let linkFailed = 0;

    // Tentar linkar fotos órfãs aos seus históricos
    for (const foto of fotosOrphans) {
      console.log(`[DEBUG] Processando foto ${foto.id}: agendamentoId=${foto.agendamentoId}, nomeArquivo=${foto.nomeArquivo}`);

      if (foto.agendamentoId) {
        try {
          const agendamento = await Agendamento.findByPk(foto.agendamentoId);
          if (agendamento) {
            console.log(`[DEBUG] Agendamento ${foto.agendamentoId} encontrado, buscando histórico...`);

            const historico = await HistoricoConsulta.findOne({
              where: {
                petId: agendamento.petId,
                data: agendamento.data,
                tipoAtendimento: agendamento.tipoAtendimento
              }
            });

            if (historico) {
              await foto.update({ historicoConsultaId: historico.id });
              console.log(`[INFO] ✅ Foto ${foto.id} linkada ao histórico ${historico.id}`);
              linked++;
            } else {
              console.log(`[WARNING] ⚠️ Nenhum histórico encontrado para foto ${foto.id} do agendamento ${foto.agendamentoId}`);
              linkFailed++;
            }
          } else {
            console.log(`[WARNING] ⚠️ Agendamento ${foto.agendamentoId} não encontrado para foto ${foto.id}`);
            linkFailed++;
          }
        } catch (erroLink) {
          console.error(`[ERROR] Erro ao linkar foto ${foto.id}:`, erroLink.message);
          linkFailed++;
        }
      } else {
        console.log(`[DEBUG] Foto ${foto.id} não tem agendamentoId, será candidata à deleção`);
        linkFailed++;
      }
    }

    // Detectar e deletar fotos totalmente órfãs (sem agendamentoId nem historicoConsultaId)
    const fotosCompletelyOrphan = await Anexo.findAll({
      where: { historicoConsultaId: null, agendamentoId: null }
    });

    let deleted = 0;
    for (const foto of fotosCompletelyOrphan) {
      try {
        // Tentar deletar arquivo do disco
        if (fs.existsSync(foto.caminhoArquivo)) {
          fs.unlinkSync(foto.caminhoArquivo);
          console.log(`[INFO] Arquivo físico deletado: ${foto.caminhoArquivo}`);
        }
        await foto.destroy();
        console.log(`[INFO] 🗑️ Foto ${foto.id} completamente órfã deletada`);
        deleted++;
      } catch (erroDel) {
        console.error(`[ERROR] Erro ao deletar foto ${foto.id}:`, erroDel.message);
      }
    }

    // Detectar e reportar possíveis duplicatas
    const duplicateCheck = await Anexo.findAll({
      attributes: ['nomeArquivo', 'agendamentoId', 'historicoConsultaId'],
      order: [['nomeArquivo', 'ASC'], ['createdAt', 'ASC']]
    });

    let potentialDuplicates = [];
    for (let i = 0; i < duplicateCheck.length - 1; i++) {
      if (
        duplicateCheck[i].nomeArquivo === duplicateCheck[i + 1].nomeArquivo &&
        duplicateCheck[i].agendamentoId === duplicateCheck[i + 1].agendamentoId
      ) {
        potentialDuplicates.push({
          arquivo: duplicateCheck[i].nomeArquivo,
          agendamentoId: duplicateCheck[i].agendamentoId,
          count: 2
        });
      }
    }

    res.json({
      sucesso: true,
      resumo: {
        fotosLinkadas: linked,
        linksFalhados: linkFailed,
        fotosDeletadas: deleted,
        potentialDuplicates: potentialDuplicates.length > 0 ? potentialDuplicates : 'Nenhuma duplicata encontrada'
      },
      mensagem: `✅ Limpeza concluída: ${linked} fotos linkadas, ${deleted} fotos órfãs deletadas${potentialDuplicates.length > 0 ? `, ${potentialDuplicates.length} possível(is) duplicata(s)` : ''}`
    });
  } catch (erro) {
    console.error('[ERROR] Erro durante limpeza de órfãs:', erro);
    res.status(500).json({ sucesso: false, erro: erro.message });
  }
};
