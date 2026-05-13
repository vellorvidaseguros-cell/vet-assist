import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcryptjs from 'bcryptjs';
import sequelize from './database.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { Veterinario, Cliente, Pet, Agendamento, Consulta, Vacina, HistoricoConsulta, Anexo, Faturamento, Veiculo, Despesa } from './models/index.js';

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
const PORT = process.env.PORT || 5000;

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
    console.log('[INFO] Sincronizando banco de dados SQLite...');
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

    // Servir frontend React buildado
    const frontendDist = path.join(__dirname, '../frontend/dist');
    app.use(express.static(frontendDist));

    // Rota de teste para verificar se o app está servindo HTML
    app.get('/app', (req, res) => {
      res.send(`
        <!DOCTYPE html>
        <html>
        <head><title>VetAssist App</title></head>
        <body>
          <h1>✅ VetAssist está rodando em produção!</h1>
          <p>Frontend dist path: ${frontendDist}</p>
          <p>Dist exists: ${fs.existsSync(frontendDist)}</p>
          <p>Index.html exists: ${fs.existsSync(path.join(frontendDist, 'index.html'))}</p>
          <hr>
          <p><strong>API Status:</strong> <a href="/api/status">/api/status</a></p>
          <p><strong>Clientes:</strong> <a href="/api/clientes">/api/clientes</a></p>
        </body>
        </html>
      `);
    });

    // Para qualquer rota que não seja API, retorna index.html (SPA routing)
    app.get('*', (req, res) => {
      if (!req.path.startsWith('/api') && !req.path.startsWith('/backend') && !req.path.startsWith('/test-')) {
        const indexPath = path.join(frontendDist, 'index.html');
        if (fs.existsSync(indexPath)) {
          res.sendFile(indexPath);
        } else {
          res.status(404).send(`
            <!DOCTYPE html>
            <html>
            <head><title>Frontend não encontrado</title></head>
            <body>
              <h1>❌ Frontend não encontrado</h1>
              <p>Arquivo esperado: ${indexPath}</p>
              <p><a href="/app">Verificar status</a></p>
            </body>
            </html>
          `);
        }
      }
    });

    // Error handler
    app.use((err, req, res, next) => {
      console.error('[ERROR]', err);
      res.status(500).json({ sucesso: false, erro: err.message });
    });

    // 404 handler (API only)
    app.use((req, res) => {
      if (req.path.startsWith('/api')) {
        res.status(404).json({ sucesso: false, erro: 'Rota não encontrada' });
      }
    });

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`\n[OK] Servidor rodando na porta ${PORT}`);
      console.log(`[INFO] Ambiente: ${process.env.NODE_ENV || 'development'}`);
      console.log(`[INFO] Status: http://localhost:${PORT}/api/status\n`);
    });
  } catch (err) {
    console.error('[ERROR] Erro ao iniciar servidor:', err);
    process.exit(1);
  }
}

iniciarServidor();
