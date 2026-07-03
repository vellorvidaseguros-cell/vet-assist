import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcryptjs from 'bcryptjs';
import sequelize from './database.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import http from 'http';
import { Server } from 'socket.io';
import { Veterinario, Cliente, Pet, Agendamento, Consulta, Vacina, HistoricoConsulta, Anexo, Faturamento, Veiculo, Despesa } from './models/index.js';
import { initLembretesJob, startCleanup } from './jobs/lembretesJob.js';
import { autenticar } from './middleware/auth.js';

// Rotas
import veterinariosRoutes from './routes/veterinarios.js';
import clientesRoutes from './routes/clientes.js';
import { seedTestData } from './seed.js';
import petsRoutes from './routes/pets.js';
import agendamentosRoutes from './routes/agendamentos.js';
import consultasRoutes from './routes/consultas.js';
import vacinasRoutes from './routes/vacinas.js';
import historicoRoutes from './routes/historico.js';
import faturamentoRoutes from './routes/faturamento.js';
import veiculosRoutes from './routes/veiculos.js';
import despesasRoutes from './routes/despesas.js';
import perfilRoutes from './routes/perfil.js';
import anexosRoutes from './routes/anexos.js';

dotenv.config();

// Force production mode if DATABASE_URL is set (Railway environment)
if (process.env.DATABASE_URL && !process.env.NODE_ENV) {
  process.env.NODE_ENV = 'production';
}

const app = express();

// Detectar porta disponível automaticamente
async function encontrarPortaDisponivel(portaInicial = 5000) {
  const { createServer } = await import('net')
  for (let porta = portaInicial; porta < portaInicial + 20; porta++) {
    const disponivel = await new Promise((resolve) => {
      const srv = createServer()
      srv.once('error', () => resolve(false))
      srv.once('listening', () => { srv.close(); resolve(true) })
      srv.listen(porta, '0.0.0.0')
    })
    if (disponivel) return porta
  }
  throw new Error('Nenhuma porta disponível entre ' + portaInicial + ' e ' + (portaInicial + 20))
}

// Salvar porta em arquivo para o frontend descobrir
function salvarPorta(porta) {
  try {
    fs.writeFileSync(path.join(__dirname, '../.backend-port'), String(porta))
    console.log(`[INFO] Porta salva em .backend-port: ${porta}`)
  } catch (err) {
    console.warn('[WARN] Não foi possível salvar .backend-port:', err.message)
  }
}

const PORT_INICIAL = parseInt(process.env.PORT) || 5000;

// Obter __dirname em módulos ES6
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware para servir arquivos estáticos com headers apropriados
app.use('/backend/uploads', (req, res, next) => {
  // Adicionar headers CORS
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.header('Pragma', 'no-cache');
  res.header('Expires', '0');
  next();
}, express.static(path.join(__dirname, 'uploads')));

console.log('[INFO] Express.static configurado para:', path.join(__dirname, 'uploads'));

// Configurar associações
HistoricoConsulta.belongsTo(Pet, { foreignKey: 'petId' })
HistoricoConsulta.belongsTo(Cliente, { foreignKey: 'clienteId' })
Pet.hasMany(HistoricoConsulta, { foreignKey: 'petId' })
Cliente.hasMany(HistoricoConsulta, { foreignKey: 'clienteId' })

// Associações para Faturamento
Faturamento.belongsTo(Cliente, { foreignKey: 'clienteId' })
Faturamento.belongsTo(HistoricoConsulta, { foreignKey: 'historicoConsultaId' })
Cliente.hasMany(Faturamento, { foreignKey: 'clienteId' })
HistoricoConsulta.hasMany(Faturamento, { foreignKey: 'historicoConsultaId' })

// Associações para Anexo (fotos)
Anexo.belongsTo(Agendamento, { foreignKey: 'agendamentoId' })
Anexo.belongsTo(HistoricoConsulta, { foreignKey: 'historicoConsultaId' })
Agendamento.hasMany(Anexo, { foreignKey: 'agendamentoId' })
HistoricoConsulta.hasMany(Anexo, { foreignKey: 'historicoConsultaId' })

// Rota de teste para uploads
app.get('/test-uploads/:filename', (req, res) => {
  const filePath = path.join(__dirname, 'uploads', req.params.filename);
  console.log(`[DEBUG] Tentando servir arquivo: ${filePath}`);
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error(`[ERROR] Arquivo não encontrado: ${filePath}`);
      res.status(404).json({ sucesso: false, erro: 'Arquivo não encontrado', filePath });
    }
  });
});

// Status check
app.get('/api/status', (req, res) => {
  res.json({
    message: '[OK] Backend do VetAssist rodando!',
    timestamp: new Date().toLocaleString('pt-BR'),
    version: '1.0.0'
  });
});

// Sincronizar banco de dados e iniciar servidor
async function iniciarServidor() {
  try {
    const dbType = process.env.DATABASE_URL ? 'PostgreSQL' : 'SQLite';
    console.log(`[INFO] Sincronizando banco de dados (${dbType})...`);
    await sequelize.sync({ force: false });
    console.log('[OK] Banco de dados sincronizado!');

    // Criar veterinário padrão se não existir
    const vetExistente = await Veterinario.findOne({ where: { email: 'admin@vetassist.com' } });
    if (!vetExistente) {
      const senhaHasheada = await bcryptjs.hash('admin123', 10);
      await Veterinario.create({
        nome: 'Administrador',
        email: 'admin@vetassist.com',
        senha: senhaHasheada,
        telefone: '(11) 9999-9999',
        cpf: '00000000000',
        crmv: '0000000'
      });
      console.log('[INFO] Veterinário padrão criado!');
    }

    // Inserir dados de teste
    await seedTestData()

    // Autenticação JWT obrigatória em todas as rotas /api
    // (exceções públicas definidas em middleware/auth.js: login, status, backend-info)
    app.use('/api', autenticar);

    // Rotas da API
    app.use('/api/veterinarios', veterinariosRoutes);
    app.use('/api/clientes', clientesRoutes);
    app.use('/api/pets', petsRoutes);
    app.use('/api/agendamentos', agendamentosRoutes);
    app.use('/api/consultas', consultasRoutes);
    app.use('/api/vacinas', vacinasRoutes);
    app.use('/api/historico', historicoRoutes);
    app.use('/api/faturamento', faturamentoRoutes);
    app.use('/api/veiculos', veiculosRoutes);
    app.use('/api/despesas', despesasRoutes);
    app.use('/api/perfil', perfilRoutes);
    app.use('/api/anexos', anexosRoutes);

    // Endpoint para o frontend descobrir a porta do backend (Socket.IO direto)
    app.get('/api/backend-info', (req, res) => {
      const porta = global.__BACKEND_PORT__ || 5000;
      res.json({
        porta,
        socketUrl: `http://localhost:${porta}`,
        wsUrl: `ws://localhost:${porta}`
      });
    });

    // Servir service-worker.js explicitamente
    app.get('/service-worker.js', (req, res) => {
      res.setHeader('Content-Type', 'application/javascript');
      res.sendFile(path.join(__dirname, '../frontend/public/service-worker.js'));
    });

    // Servir manifest.json explicitamente
    app.get('/manifest.json', (req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.sendFile(path.join(__dirname, '../frontend/public/manifest.json'));
    });

    // Endpoint de teste (será movido após criar Socket.IO)
    // Placeholder para adicionar depois de Socket.IO estar disponível

    // Criar servidor HTTP passando app direto
    // Socket.IO será attached depois e vai interceptar /socket.io automaticamente
    const server = http.createServer(app);

    console.log('[INFO] Criando Socket.IO...');
    const io = new Server(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        credentials: false
      },
      transports: ['websocket', 'polling'],
      pingInterval: 25000,
      pingTimeout: 60000,
      path: '/socket.io/'
    });

    // Tornar io global para acesso em outros endpoints
    global.io = io;

    console.log('[INFO] Socket.IO criado com sucesso!')
    console.log('[DEBUG] Registrando handlers do Socket.IO...');

    // Endpoint de teste para emitir eventos Socket.IO
    app.get('/test-emit', (req, res) => {
      console.log('[TEST] Emitindo evento de teste via Socket.IO...');
      io.emit('lembrete', {
        id: 999,
        titulo: 'Lembrete de Teste',
        body: '🧪 Este é um lembrete de teste do sistema',
        cliente: 'Teste',
        pet: 'Teste',
        hora: '17:00',
        tipo: '5min',
        timestamp: new Date().toISOString()
      });
      res.json({ sucesso: true, mensagem: 'Evento de teste emitido' });
    });

    // Error handler - deve vir ANTES do 404 handler
    app.use((err, req, res, next) => {
      console.error('[ERROR]', err);
      const isProd = process.env.NODE_ENV === 'production' || !!process.env.DATABASE_URL;
      res.status(500).json({
        sucesso: false,
        erro: isProd ? 'Erro interno do servidor' : err.message
      });
    });

    // Servir frontend React buildado
    const frontendDist = path.join(__dirname, '../frontend/dist');
    app.use(express.static(frontendDist));

    // 404 handler para rotas /api
    app.use((req, res) => {
      if (req.path.startsWith('/api')) {
        res.status(404).json({ sucesso: false, erro: 'Rota não encontrada' });
      } else {
        // Para rotas não-API que chegam aqui, retorna index.html para SPA fallback
        const indexPath = path.join(frontendDist, 'index.html');
        if (fs.existsSync(indexPath)) {
          res.sendFile(indexPath);
        } else {
          // Se index.html não existir, retorna 404
          res.status(404).send(`
            <!DOCTYPE html>
            <html>
            <head><title>404 - Página não encontrada</title></head>
            <body style="font-family: Arial; text-align: center; padding: 40px;">
              <h1>❌ Página não encontrada</h1>
              <p><a href="/">Voltar para Home</a></p>
            </body>
            </html>
          `);
        }
      }
    });

    // Configurar Socket.IO
    io.on('connection', (socket) => {
      console.log(`[Socket] Cliente conectado: ${socket.id}`);

      socket.on('disconnect', () => {
        console.log(`[Socket] Cliente desconectado: ${socket.id}`);
      });

      // Ouvir eventos do cliente
      socket.on('ativarLembretes', () => {
        console.log(`[Socket] Cliente ${socket.id} ativou lembretes`);
      });
    });

    // Iniciar job de lembretes
    initLembretesJob(io);
    startCleanup();

    // Encontrar porta disponível automaticamente
    const PORT = await encontrarPortaDisponivel(PORT_INICIAL);
    salvarPorta(PORT);
    global.__BACKEND_PORT__ = PORT;  // disponível para /api/backend-info

    server.listen(PORT, '0.0.0.0', () => {
      console.log(`\n[OK] Servidor rodando na porta ${PORT}`);
      console.log(`[INFO] Ambiente: ${process.env.NODE_ENV || 'development'}`);
      console.log(`[INFO] Status: http://localhost:${PORT}/api/status`);
      console.log(`[INFO] WebSocket: ws://localhost:${PORT}\n`);
    });
  } catch (err) {
    console.error('[ERROR] Erro ao iniciar servidor:', err);
    process.exit(1);
  }
}

iniciarServidor();
