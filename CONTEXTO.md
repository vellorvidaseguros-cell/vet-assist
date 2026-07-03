# VetAssist - Contexto para Continuação de Desenvolvimento

## Projeto
App de gestão veterinária full-stack com versão mobile (PWA via ngrok).

## Estrutura
```
D:\Claude Code\Vet.Assist\
├── backend/          # Node.js + Express + SQLite (porta 5000)
├── frontend/         # React + Vite (porta 5173)
└── CONTEXTO.md       # Este arquivo
```

## Como Iniciar o App (SEMPRE fazer isso quando precisar reiniciar)
```bash
# 1. Backend
cd "/d/Claude Code/Vet.Assist/backend" && nohup npm start > /tmp/backend.log 2>&1 &
# 2. Frontend
cd "/d/Claude Code/Vet.Assist/frontend" && nohup npm run dev > /tmp/frontend.log 2>&1 &
# 3. Ngrok (acesso mobile)
nohup ngrok http 5173 > /tmp/ngrok.log 2>&1 &
sleep 6
# 4. Verificar
curl -s http://localhost:5000/api/status
curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"[^"]*"'
```

## Acesso
- Desktop: http://localhost:5173
- Celular (WiFi): http://192.168.15.27:5173
- Celular (externo): https://factoid-earflap-debtor.ngrok-free.dev

## Stack
- Frontend: React + Vite + Axios + CSS puro
- Backend: Express + Sequelize + SQLite (dev) / PostgreSQL (prod)
- Mobile: PWA, createPortal para modais, service worker (versão atual: v12)

## Modelos de Banco (backend/models/)
- `Veterinario` - conta do vet
- `Cliente` - donos de pets
- `Pet` - animais (tem dataNascimento calculando idade automaticamente)
- `Agendamento` - consultas agendadas
- `HistoricoConsulta` - histórico de atendimentos
- `Faturamento` - cobranças
- `Anexo` - fotos (ligadas a agendamento E histórico)
- `Despesa`, `Veiculo`, `Consulta`, `Vacina`

## Associações Importantes (server.js)
```js
HistoricoConsulta → Pet, Cliente, Faturamento, Anexo
Agendamento → Pet, Cliente, Anexo
Anexo → Agendamento, HistoricoConsulta
```

## Componentes Mobile Principais
| Arquivo | Função |
|---------|--------|
| `MobileHome.jsx` | Dashboard: Hoje/Próximos/Anteriores + filtro funil |
| `MobileAgendamentosCard.jsx` | Card do agendamento (com botão 🗑️ delete) |
| `MobileAgendamentoDetalhes.jsx` | Detalhes + foto upload direto (sem modal) |
| `MobileClienteDetalhes.jsx` | Detalhes cliente + pets com data de nascimento |
| `MobileCobrancas.jsx` | Cobranças com 3 botões: Detalhes, Enviar, Registrar |
| `AnimalHistoryModal.jsx` | Histórico do animal com fotos expandíveis (lightbox) |
| `NovoAgendamentoModal.jsx` | Criar agendamento com múltiplos tipos de atendimento |

## Funcionalidades Implementadas Recentemente

### Dashboard (MobileHome)
- Abas: Hoje | Próximos | Anteriores | 🔽(filtro)
- Filtro de status como dropdown (Pendente, Confirmado, Concluído, etc.)
- Badge vermelho no funil quando filtro ativo

### Agendamentos (NovoAgendamentoModal)
- **Múltiplos tipos** por consulta (Tipo 1 + Tipo 2...)
- Cada atendimento tem: Tipo, Valor próprio, Descrição própria
- Valor total calculado automaticamente
- Botão ➕ para adicionar mais tipos
- Tipos salvos como "Consulta Geral + Vacinação" no banco

### Fotos (MobileAgendamentoDetalhes)
- Botão `+ Foto` = label do input file (sem modal intermediário)
- Abre galeria/câmera do celular diretamente
- Upload imediato ao selecionar
- Suporta HEIC/HEIF (iPhone), PNG, JPG, WebP até 15MB

### Histórico Animal (AnimalHistoryModal)
- Cards expandíveis ao clicar
- Mostra fotos em grid ao expandir
- Lightbox com ← Voltar ao clicar na foto
- createPortal no body

### Clientes (MobileClienteDetalhes)
- Data de nascimento do pet (campo date picker)
- Idade calculada automaticamente: "2 anos e 3 meses"
- Util: `src/utils/idadeUtils.js` → `calcularIdade(dataNascimento)`
- Scroll funcionando via portal + overflow no body

### Cobranças (MobileCobrancas)
- 3 botões por card: `📋 Detalhes` | `📤 Enviar` | `💰 Registrar`
- **Detalhes**: busca histórico do animal via `/api/historico/animal/:petId`
- **Enviar**: modal com escolha WhatsApp (abre wa.me) ou Email (mailto)
- **Registrar**: PagamentoModal existente

## Tarefas Recentes

### 💳 Planos, permissões e painel admin (03/07/2026)
- Contas têm: `role` (admin/vet), `plano` (basico/plus/max), `ativo`, `permissoes` (custom)
- Config central: `backend/config/planos.js` (recursos + presets de plano)
- Planos: Básico (clientes+orçamentos) | Plus (+agenda+cobranças) | Max (tudo)
- Backend bloqueia rotas por recurso via `exigirRecurso()` em server.js
- Suspensão de conta (inadimplência): bloqueio IMEDIATO (middleware relê a conta a cada request)
- Painel admin: aba "🔑 Administração" (só admin@vetassist.com) — criar conta,
  mudar plano, customizar permissões por conta, suspender/reativar, redefinir senha
- API: /api/admin/contas (GET/POST/PUT), /api/admin/planos, /api/veterinarios/me
- Frontend esconde abas sem permissão (Sidebar + bottom nav + fallback 🔒)
- Login não expõe mais credenciais de teste; migração: scripts/migrate-planos.js
- Contas: admin@vetassist.com = ADMIN (⚠️ trocar senha admin123!); Camila = vet plano Max
- Service worker: v17

### 🏢 Multi-tenancy implementado (03/07/2026)
- `veterinarioId` em: Cliente, Pet, Agendamento, HistoricoConsulta, Faturamento, Despesa, Veiculo
- Migração: `scripts/migrate-multitenancy.js` (executada; dados atribuídos à conta real id=1 Camila)
- Todos os controllers filtram por `req.veterinario.id` (vindo do JWT)
- Fotos protegidas via dono do agendamento/histórico pai
- Cada vet gerencia apenas a própria conta (403 em contas alheias)
- ⚠️ IMPORTANTE: os dados pertencem à conta cami_dinizj@hotmail.com (id=1).
  A conta admin@vetassist.com (id=2) agora vê o app VAZIO — é só seed.
- Pendências: Socket.IO/lembretes ainda sem separação por tenant;
  arquivos estáticos /backend/uploads públicos (nomes não adivinháveis);
  rotas legadas vacinas/consultas sem tenancy (não usadas pelo frontend)

### 🔐 Autenticação JWT implementada (03/07/2026)
- Middleware `backend/middleware/auth.js` protege TODAS as rotas /api
- Rotas públicas: `/api/veterinarios/login`, `/api/status`, `/api/backend-info`
- Token no header `Authorization: Bearer` OU query `?token=` (para PDF/imagens em nova aba)
- Frontend já tinha login + interceptors prontos (main.jsx) — nada mudou no fluxo
- Fotos via `/api/anexos/file/:id` usam helper `src/utils/fotoUrl.js` (anexa token)
- ⚠️ TROCAR a senha padrão admin@vetassist.com/admin123 (está no código-fonte!)
- Service worker: v16

### 📋 Auditoria completa (03/07/2026) — ver AUDITORIA_2026-07-03.md
- 5 bugs corrigidos e testados (hora opcional no banco + migração, PDF inline, fotos no PDF, emojis no PDF, campos do histórico)
- git em dia: commit de consolidação ba78f83
- ngrok bloqueado pelo Windows nesta máquina ("Acesso negado") — usar WiFi local ou reinstalar
- Próximos passos comerciais: multi-tenancy (dados por veterinarioId) → deploy Railway → pilotos → cobrança

### ✅ PDF de Histórico na Cobrança - COMPLETO
- Botão "📋 PDF" em cobranças abre histórico em nova aba
- PDF gerado com `pdfkit` (biblioteca instalada)
- Inclui:
  - Cliente (nome, telefone, email)
  - Animal (nome, espécie, raça)
  - Data e tipo de consulta
  - Procedimentos, diagnóstico, medicamentos
  - Observações, próximo retorno
  - **Fotos do atendimento em grid**
  - Valor da consulta
- Formato profissional com logo VetAssist
- Veterinário escolhe: visualizar, imprimir (Ctrl+P) ou fazer download
- Mesmo conteúdo visual que aparece em CLIENTE > HISTÓRICO

### ✅ Horário Obrigatório - REMOVIDO
- Campo "Hora" agora é opcional (não obrigatório)
- Frontend: removida validação + label atualizado
- Backend: removida validação + erro message atualizado
- Veterinários podem registrar agendamento sem hora e atualizar depois

## Padrões CSS/JSX
- Todos modais usam `createPortal(jsx, document.body)`
- Overlay com `position: fixed; overflow-y: auto; z-index: máximo`
- Modal com `min-height: 100vh; display: block`
- Scroll do body bloqueado com useEffect quando modal abre
- Service worker em `public/service-worker.js` (atualizar versão ao mudar CSS/JS)

## Endpoints API Relevantes
```
GET  /api/agendamentos
GET  /api/agendamentos/:id         (inclui Anexos)
POST /api/agendamentos
PUT  /api/agendamentos/:id
DELETE /api/agendamentos/:id

GET  /api/clientes
GET  /api/clientes/:id
GET  /api/pets
POST /api/pets
PUT  /api/pets/:id

GET  /api/historico/animal/:petId  (inclui Anexos)
GET  /api/historico               (lista todos)

GET  /api/faturamento
GET  /api/faturamento/resumo/financeiro

POST /api/anexos/upload            (multipart, campo: "arquivo")
GET  /api/anexos/agendamento/:id
GET  /api/anexos/file/:id          (serve a imagem)

GET  /api/perfil/tabela-precos     (preços por tipo de atendimento)
```

## Regras do Projeto
1. **Inicialização completa**: Backend + Frontend + Ngrok (sempre os 3)
2. Sempre `createPortal` em modais mobile
3. Bumpar versão do service worker ao mudar CSS/JS (v12 atual)
4. iOS: usar `accept="image/*"` sem `capture=` para dar opção galeria/câmera
5. Modais: `overflow: hidden` no body quando abertos
6. Língua: PT-BR em toda interface
