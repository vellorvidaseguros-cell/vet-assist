# VetAssist — Documento de Entrega para Desenvolvedor

Última atualização: 2026-07-10. Este documento substitui os outros arquivos de
handoff soltos na raiz do projeto (HANDOFF.md, COMO_CONTINUAR.md, RETOMAR_AQUI.md
etc.) — eles ficaram desatualizados ao longo do tempo. Use este como fonte da
verdade e, se possível, apague os outros depois de migrar o que ainda for útil.

## 1. O que é o app

VetAssist é um sistema de gestão para veterinários que atendem a domicílio
(nicho: vet domiciliar — ver `ESTUDO-MERCADO.md`). Cobre agenda, clientes/animais,
histórico de atendimentos, cobranças/faturamento, orçamentos, estoque de insumos,
compartilhamento de casos entre vets, e um painel administrativo (multi-conta).
É uma PWA (instalável no celular) com foco mobile-first.

## 2. Stack técnica

- **Frontend**: React 18 + Vite 5, sem TypeScript. CSS puro (não Tailwind, não
  CSS Modules — arquivos `.css` globais por componente, ver seção 5).
- **Backend**: Node.js + Express + Sequelize.
- **Banco de dados**: SQLite em desenvolvimento (`backend/database.sqlite` /
  `vet_assist.db` na raiz — confira qual está ativo em `backend/database.js`),
  PostgreSQL em produção (Railway, via `DATABASE_URL`).
- **Realtime**: Socket.IO (uma única conexão global no frontend, ver seção 6).
- **PWA**: Service Worker manual em `frontend/public/service-worker.js`
  (cache versionado por `CACHE_NAME` — **sempre bump ao fazer deploy**, senão o
  celular do usuário mantém a versão antiga em cache).
- **Jobs agendados**: `node-schedule` (`backend/jobs/lembretesJob.js`) —
  lembretes de agendamento e avisos de cobrança a vencer.
- **PDF**: `pdfkit` (histórico do animal, orçamentos, cobranças).
- **Deploy**: Railway (`railway.toml` na raiz). Build automático a cada
  `git push` na branch `main`.

## 3. Como rodar localmente

```bash
# Windows, Git Bash (o projeto foi desenvolvido nesse ambiente)
cd "D:\Claude Code\Vet.Assist"
bash reiniciar-app.sh
```

Esse script mata processos antigos nas portas 5000/5173 e sobe backend +
frontend em background. Logs em `/tmp/backend.log` e `/tmp/frontend.log`.

Manualmente, se o script não funcionar:
```bash
cd backend && npm install && npm start        # porta 5000
cd frontend && npm install && npm run dev      # porta 5173 (Vite)
```

Login de teste: `admin@vetassist.com` / `admin123` (conta admin local).

**Acesso pelo celular**: mesma rede Wi-Fi do computador, via IP local
(`http://<IP-DA-REDE-LOCAL>:5173`). O IP local já está liberado em
`frontend/vite.config.js` (`allowedHosts`) — se o IP do computador mudar,
esse arquivo precisa ser atualizado ou o Vite responde 403.

## 4. Deploy em produção (Railway)

- URL fixa: `https://vet-assist-app-production.up.railway.app`
- Conta Railway: `vetassistapp-bit` (login via Gmail `vetflow.app@gmail.com`).
  Projeto: `vet-assist`.
- **Deploy é automático**: qualquer `git push` para `main` no GitHub
  (`vellorvidaseguros-cell/vet-assist`) builda e publica em 1–3 minutos.
- Antes de cada push que afete o frontend:
  1. `cd frontend && npx vite build` (gera `frontend/dist`, que É versionado
     no git — não está no `.gitignore`, propositalmente, pois o Railway usa
     esse build).
  2. Bump `CACHE_NAME` em `frontend/public/service-worker.js` (ex: `v31` → `v32`).
  3. Commit + push.
- Para rodar comandos direto contra o banco de produção (ex: uma migração),
  use a Railway CLI já configurada localmente:
  ```bash
  railway run node scripts/algum-script.js
  ```
  Isso injeta `DATABASE_URL` de produção no processo local — **use com cuidado**,
  é o banco real.

### ⚠️ Armadilha recorrente: Sequelize não migra colunas novas sozinho

`sequelize.sync({ force: false })` (usado no boot do backend) só cria tabelas
que não existem — **nunca altera uma tabela já existente** (não adiciona
coluna nova, por exemplo). Toda vez que um `model` ganha um campo novo:
1. Crie um script em `scripts/` com um `ALTER TABLE` raw (ver
   `scripts/migrate-vencimento-cobranca.js` como modelo — é idempotente,
   ignora erro de "coluna já existe").
2. Rode localmente: `node scripts/seu-script.js` (com o backend **parado**,
   SQLite trava o arquivo).
3. Rode em produção: `railway run node scripts/seu-script.js`.
Sem isso o backend derruba com erro tipo `no such column` (SQLite) ou
equivalente no Postgres assim que alguém tentar salvar/ler o campo novo.

## 5. Pontos de atenção da arquitetura (armadilhas conhecidas)

- **CSS não é escopado por componente.** Cada componente importa seu próprio
  `.css`, mas as classes são globais — já houve colisão de nomes entre
  arquivos (ex: `.error-message` definida em vários lugares com estilos
  diferentes). Ao criar uma classe nova, prefira prefixar com uma sigla do
  componente (`ncm-`, `wl-`, `notif-` são exemplos já usados) para evitar
  colisão.
- **`index.css` tem uma regra global agressiva**: em telas ≤480px,
  `button { width: 100% !important }`. Qualquer botão que deva ficar
  pequeno/inline (ícone, "×", ação secundária dentro de uma linha) precisa de
  `width: auto !important` explícito, ou ficar coberto por
  `button[class*="close" i]` (já tratado centralizado em `index.css`).
- **Sistema de cores/tipografia**: `frontend/src/styles/variables.css` define
  `--color-primary/success/warning/danger/info` (+ variantes `-bg`) e a escala
  `--font-size-2xs` a `--font-size-5xl` / `--font-weight-regular` a `-bold`.
  **Regra de produto explícita do dono do app**: não usar cor decorativa —
  reservar cor apenas para o estado mais urgente/acionável de uma tela (ex:
  só a cobrança vencida fica vermelha; "vence hoje"/"vence em N dias" ficam
  neutros). Já houve dois pushbacks explícitos do usuário sobre "carnaval de
  cores" — não reintroduzir paletas decorativas.
- **Gesto de arrastar para fechar (swipe-to-close)**: hook reutilizável em
  `frontend/src/hooks/useSwipeToClose.js`, aplicado a ~23 modais. Arrastar a
  partir dos ~30px da borda esquerda da tela fecha o modal (imita o gesto
  nativo do iOS). Limiar de fechamento atual: 60% da largura da tela. Ao criar
  um modal novo, reaproveite esse hook em vez de reinventar.
- **`input[type="date"]` no iOS Safari ignora `width`/`height` via CSS**,
  mesmo com `!important`. A solução usada no projeto é envolver o input num
  `<div>` wrapper com altura fixa + `overflow: hidden` (ver `.nam-date-wrapper`
  em `NovoAgendamentoModal.css` e `.ncm-date-wrapper` em
  `NovoClienteModal.css`). Centralizar o texto dentro do input nativo do iOS
  não responde a `text-align` de forma confiável — o truque que funciona é
  deixar o `<input>` com `width: auto` dentro de um wrapper `flex;
  justify-content: center`.
- **Postgres retorna colunas `DATE` como objeto `Date` nativo**, enquanto
  SQLite retorna string — código que faz parsing manual de datas (ex:
  `formatarDataSemFuso` em `HistoricoConsultaController.js`) precisa tratar os
  dois casos, senão bugs que não aparecem em dev (SQLite) explodem só em
  produção (Postgres).
- **`LembretesListener.jsx` é a única conexão Socket.IO do frontend.** Outros
  componentes não devem abrir socket próprio — comunicam-se via
  `window.dispatchEvent(new CustomEvent(...))` /
  `window.addEventListener(...)`. Backend emite evento global via
  `global.io.emit(...)`, e o frontend filtra por `veterinarioId` no cliente
  quando o evento é destinado a um vet específico (padrão usado por
  lembretes, feedback, avisos, vencimento de cobrança).
- **Verificação de UI**: antes de considerar uma mudança de frontend pronta,
  rode `npx vite build --mode development` (pega erro de sintaxe rápido) e
  teste de fato no navegador/celular — o build passar não significa que a
  funcionalidade funciona.

## 6. Estrutura de pastas (visão geral)

```
Vet.Assist/
├── backend/
│   ├── controllers/     # lógica de cada recurso (AgendamentoController, FaturamentoController...)
│   ├── models/           # modelos Sequelize (um arquivo por tabela)
│   ├── routes/            # define os endpoints REST, monta os controllers
│   ├── jobs/               # node-schedule: lembretesJob.js (lembretes + avisos de cobrança)
│   ├── middleware/     # autenticação (JWT), etc.
│   ├── services/           # regras de negócio auxiliares
│   ├── database.js        # conexão Sequelize (decide SQLite x Postgres por env)
│   └── server.js            # bootstrap Express + Socket.IO + rotas
├── frontend/
│   ├── src/
│   │   ├── components/   # a maior parte do app vive aqui (telas + modais)
│   │   ├── pages/           # Dashboard.jsx (shell principal com abas)
│   │   ├── hooks/           # useSwipeToClose.js
│   │   ├── styles/          # variables.css (cores/tipografia)
│   │   └── utils/           # conta.js (permissões/plano), etc.
│   └── public/service-worker.js  # PWA cache
├── scripts/                    # scripts avulsos de migração/manutenção (rodar manualmente)
├── railway.toml                 # config de deploy Railway
└── reiniciar-app.sh              # sobe backend+frontend local
```

## 7. Funcionalidades recentes (contexto útil para dar manutenção)

- **Avisos**: admin publica uma mensagem (`POST /api/avisos`) que aparece para
  todos os vets via badge no ícone de feedback (`FeedbackWidget.jsx`), com
  broadcast em tempo real via Socket.IO (`novoAviso`).
- **Vencimento de cobranças**: campo `dataVencimento` em `Faturamento`. Job
  diário (`lembretesJob.js`, 9h) avisa o vet quando uma cobrança está perto de
  vencer ou já venceu, respeitando preferência configurável em
  `NotificacoesModal.jsx` (dias de antecedência). Exibido na Agenda
  (`MobileHome.jsx`, lista de vencimentos ≤7 dias) e nos cards de cobrança
  (`MobileCobrancas.jsx`).
- **Edição de cobrança existente**: `NovaCobrancaModal.jsx` aceita a prop
  `cobrancaExistente` e vira formulário de edição (PUT em vez de POST).

## 8. O que NÃO está pronto / decisões em aberto

- O usuário está avaliando se toda consulta deveria gerar cobrança pendente
  automaticamente, ou se o fluxo manual atual (criar cobrança só quando
  quiser) deve continuar. Não mude esse comportamento sem confirmar.
- "Em Cobranças" (Agenda, soma todo o histórico em aberto) e "À Receber"
  (tela Cobranças, escopo do mês) têm intencionalmente escopos diferentes —
  isso foi decidido em conversa, não é bug, mas o usuário não confirmou se
  quer unificar.
- Há muitos arquivos `.md`/`.txt` de documentação na raiz que ficaram
  desatualizados (`HANDOFF.md`, `COMO_CONTINUAR.md`, `RETOMAR_AQUI.md`,
  `SUMARIO_SESSAO_20260509.txt`, etc.) — seguro ignorá-los ou removê-los em
  favor deste arquivo.

## 9. Contas e credenciais (não estão nesse backup por segurança)

Peça ao dono do app (Renato, `renato.populin@gmail.com`) acesso a:
- Repositório GitHub: `vellorvidaseguros-cell/vet-assist`
- Conta Railway: `vetassistapp-bit` / Gmail `vetflow.app@gmail.com`
- Variáveis de ambiente de produção (`DATABASE_URL`, chaves de JWT, etc. —
  configuradas direto no painel do Railway, não estão versionadas)
