# VetAssist — Guia Completo de Desenvolvimento

## 📋 Visão Geral do Projeto

**VetAssist** é um sistema de gestão para clínicas veterinárias com:
- Interface **web** (desktop) para uso no computador
- Interface **mobile** (app PWA) otimizada para celular
- Backend Node.js + Express + Sequelize
- Frontend React + Vite
- Banco SQLite (local) ou PostgreSQL (produção/Railway)

---

## 🗂️ Estrutura do Projeto

```
Vet.Assist/
├── backend/
│   ├── controllers/       # Lógica de negócio
│   │   ├── AgendamentoController.js
│   │   ├── AnexoController.js
│   │   ├── ClienteController.js
│   │   ├── FaturamentoController.js
│   │   ├── HistoricoConsultaController.js
│   │   ├── PerfilController.js
│   │   └── PetController.js
│   ├── middleware/
│   │   └── upload.js      # Configuração multer para fotos
│   ├── models/            # Modelos Sequelize
│   │   ├── index.js
│   │   ├── Agendamento.js
│   │   ├── Anexo.js
│   │   ├── Cliente.js
│   │   ├── Faturamento.js
│   │   ├── HistoricoConsulta.js
│   │   ├── Pet.js
│   │   └── Veterinario.js
│   ├── routes/            # Rotas da API
│   ├── uploads/           # Fotos dos atendimentos
│   ├── database.js        # Config SQLite/PostgreSQL
│   └── server.js          # Entry point
├── frontend/
│   ├── src/
│   │   ├── components/    # Componentes React
│   │   │   ├── Mobile*.jsx/.css   # Telas mobile
│   │   │   ├── AnimalHistory.jsx  # Histórico (web+mobile)
│   │   │   ├── PagamentoModal.jsx
│   │   │   ├── FAB.jsx
│   │   │   └── ...
│   │   ├── pages/
│   │   │   └── Dashboard.jsx  # Roteamento principal
│   │   └── utils/
│   │       └── horariosDisponiveis.js
│   ├── dist/              # Build de produção (commitado)
│   └── vite.config.js
├── railway.toml           # Config deploy Railway
├── export-sqlite.js       # Script exportar dados
├── import-postgres.js     # Script importar dados
├── setup-neon.js          # Script configurar Neon
└── vet_assist.db          # Banco SQLite local
```

---

## 🚀 Como Rodar Localmente

### Pré-requisitos
- Node.js 18+
- npm

### 1. Clonar o repositório
```bash
git clone https://github.com/vellorvidaseguros-cell/vet-assist.git
cd vet-assist
```

### 2. Instalar dependências
```bash
npm install
cd frontend && npm install && cd ..
```

### 3. Iniciar o backend
```bash
node backend/server.js
# Roda na porta 5000
```

### 4. Iniciar o frontend (outro terminal)
```bash
cd frontend
npm run dev -- --host
# Roda na porta 5173
```

### 5. Acessar
- **Rede local:** `http://SEU_IP:5173` (ex: `http://192.168.15.27:5173`)
- **Backend API:** `http://localhost:5000/api/status`

---

## 🌐 Deploy em Produção (Railway)

### URLs de Produção
- **App:** `https://vet-assist-app-production.up.railway.app`
- **GitHub:** `https://github.com/vellorvidaseguros-cell/vet-assist`

### Banco de Dados Produção (Neon PostgreSQL)
```
Host: ep-muddy-hill-aqcbzu1y.c-8.us-east-1.aws.neon.tech
Database: neondb
User: neondb_owner
```
> ⚠️ A senha completa está no arquivo `.env.migration` (não commitado por segurança)

### Como fazer novo deploy
```bash
git add .
git commit -m "descrição da mudança"
git push origin main
# Railway faz deploy automático
```

### Variáveis de ambiente no Railway
| Variável | Valor |
|---|---|
| `DATABASE_URL` | URL completa do Neon PostgreSQL |
| `DATABASE_SSL` | `true` |
| `NODE_ENV` | `production` |
| `PORT` | `5000` |

---

## 📱 Arquitetura Mobile vs Web

O app detecta automaticamente se é mobile (< 768px) e usa componentes diferentes:

| Tela | Web | Mobile |
|---|---|---|
| Home/Agenda | `DashboardHome.jsx` | `MobileHome.jsx` |
| Agendamentos | `AgendamentosList.jsx` | `MobileAgendamentosList.jsx` |
| Clientes | `ClientesList.jsx` | `MobileClientesList.jsx` |
| Cobranças | `Financeiro.jsx` | `MobileCobrancas.jsx` |
| Histórico | `AnimalHistory.jsx` (compartilhado) | `AnimalHistory.jsx` (detecta mobile) |

### Roteamento Mobile
O `Dashboard.jsx` controla qual componente renderizar baseado em:
1. Tamanho da tela (mobile vs desktop)
2. Tab ativa (agenda, clientes, cobranças, perfil, histórico)
3. Evento customizado `navegarPara` para navegação programática

---

## 🗄️ Banco de Dados

### Tabelas principais
| Tabela | Descrição |
|---|---|
| `veterinarios` | Dados do veterinário (perfil, logo, tabela de preços) |
| `clientes` | Proprietários dos animais |
| `pets` | Animais cadastrados |
| `agendamentos` | Consultas agendadas |
| `historico_consultas` | Atendimentos concluídos |
| `faturamentos` | Cobranças geradas |
| `anexos` | Fotos dos atendimentos |

### Fluxo principal
```
Agendamento criado (status: Pendente)
    ↓ Veterinário marca como Concluído
HistoricoConsulta criado automaticamente
    ↓
Faturamento criado automaticamente (status: Pendente)
    ↓ Veterinário registra pagamento
Faturamento status → Pago/Parcialmente Pago
```

### Migração de dados (SQLite → PostgreSQL)
```bash
# 1. Exportar dados locais
node export-sqlite.js  # gera backup_data.json

# 2. Criar .env.migration com DATABASE_URL do Neon
echo "DATABASE_URL=postgresql://..." > .env.migration

# 3. Criar tabelas e importar
node setup-neon.js
```

---

## 🔧 Funcionalidades Implementadas

### Mobile
- [x] Tela de agenda com abas: Hoje, Amanhã, Próximos, Passados
- [x] Cards de agendamento com botão de status (modal com opções)
- [x] Botão Detalhes para ver/editar agendamento
- [x] FAB (botão +) com: Novo Agendamento, Novo Cliente, Cobrança, Histórico
- [x] Tela de clientes em grade (Nome | Telefone | Animais)
- [x] Detalhes do cliente com edição inline
- [x] Edição de animais do cliente
- [x] Cobranças com seletor de mês
- [x] Histórico em 3 telas: Clientes → Animais → Atendimentos
- [x] Geração de PDF dos atendimentos
- [x] Lightbox para ver fotos em tamanho real
- [x] Busca de clientes no histórico e na lista de clientes

### Web
- [x] Dashboard com histórico de consultas por data
- [x] Nome e telefone do cliente visível no acordeon
- [x] Clique no nome do cliente para filtrar histórico
- [x] Lightbox para fotos
- [x] Geração de PDF (atendimento único e histórico completo)
- [x] Tabela de preços por tipo de atendimento
- [x] White label (logo, nome da clínica)

### Backend
- [x] API REST completa
- [x] Upload de fotos (multer)
- [x] Auto-criação de histórico ao concluir agendamento
- [x] Auto-geração de faturamento
- [x] Suporte SQLite (local) e PostgreSQL (produção)
- [x] Pagamento gratuito (retorno, atendimento gratuito)

---

## 📝 Padrões de Código

### CSS Mobile
- Classes prefixadas com `mobile-` para componentes mobile
- Classes `mcr-*` para linhas da lista de clientes
- Classes `mobile-atend-*` para tela de atendimentos no histórico

### Componentes
- Componentes mobile em `MobileNome.jsx` + `MobileNome.css`
- Modais usam `modal-overlay` + `modal-content`
- Status dos agendamentos: `Pendente`, `Confirmado`, `Concluído`, `Cancelado`, `Reagendado`

### API
- Todas as respostas seguem: `{ sucesso: true/false, data: ..., erro: ... }`
- Rotas: `/api/clientes`, `/api/pets`, `/api/agendamentos`, `/api/historico`, `/api/faturamento`, `/api/anexos`, `/api/perfil`

---

## ⚠️ Pontos de Atenção

1. **Campo `hora`** nos agendamentos é `DataTypes.TIME` — usar `Agendamento.update()` estático para evitar erros de conversão
2. **Fotos** ficam em `backend/uploads/` — não são commitadas no Git
3. **Banco local** (`vet_assist.db`) não é commitado — usar scripts de migração
4. **Railway** usa o `frontend/dist` commitado (buildCommand apenas instala deps do backend)
5. **Neon** é o banco de produção — gratuito até 500MB

---

## 🆘 Problemas Comuns

| Problema | Solução |
|---|---|
| "Invalid time value" | Usar `Agendamento.update()` estático |
| Frontend desatualizado no Railway | Fazer build local e commitar `frontend/dist` |
| Servidor local parado | Rodar `node backend/server.js` e `npm run dev -- --host` |
| Banco vazio em produção | Rodar `node setup-neon.js` |
