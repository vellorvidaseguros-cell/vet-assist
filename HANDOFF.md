# VetAssist — Documento de Handoff

Este documento existe para que **qualquer programador** consiga pegar este projeto do zero e continuar o trabalho, sem depender de contexto verbal do cliente ou de conversas anteriores.

Última atualização: 2026-07-07 (ver `git log` para o histórico completo e datado de cada mudança).

---

## 1. Onde está tudo

- **Repositório**: https://github.com/vellorvidaseguros-cell/vet-assist (branch `main`)
- **Pasta local de trabalho**: `D:\Claude Code\Vet.Assist`
- **Backend**: `backend/` — Node.js + Express + Sequelize
- **Frontend**: `frontend/` — React + Vite (PWA com Service Worker)
- **Banco local (dev)**: SQLite, arquivo `vet_assist.db` (gerado automaticamente, **não versionado**)
- **Banco de produção**: PostgreSQL (Railway), via variável de ambiente `DATABASE_URL`
- **Deploy**: Railway (backend) — o próprio `frontend/dist` já fica versionado no repo para o deploy servir os arquivos estáticos direto

## 2. Como rodar localmente (do zero)

```bash
# 1. Instalar dependências (raiz + frontend)
npm run install-all

# 2. Criar o arquivo backend/.env (não existe no repo por segurança). Conteúdo mínimo:
#    JWT_SECRET=qualquer-string-secreta-aqui
#    ADMIN_PASSWORD=defina-uma-senha-forte-para-o-admin   (obrigatório em produção)
#    (sem DATABASE_URL = usa SQLite local automaticamente)

# 3. Rodar as migrations pendentes (ver seção 4) — IMPORTANTE: rodar ANTES de subir o backend
node scripts/migrate-precificacao.js
node scripts/migrate-insumos.js
node scripts/migrate-documentos.js
node scripts/migrate-compartilhamento.js   # se ainda não tiver sido rodada antes
node scripts/migrate-softdelete-foto.js    # se ainda não tiver sido rodada antes
node scripts/migrate-dados-cobranca.js     # se ainda não tiver sido rodada antes

# 4. Subir tudo de uma vez (backend + frontend + ngrok para testar no celular)
bash reiniciar-app.sh
```

O script `reiniciar-app.sh` mata processos antigos nas portas 5000/5173, sobe o backend, o frontend (Vite dev server) e um túnel ngrok para acessar pelo celular. As URLs aparecem no final da execução. Logs ficam em `/tmp/backend.log`, `/tmp/frontend.log`, `/tmp/ngrok.log`.

**Atenção Windows/Git Bash**: sempre use `ngrok.cmd`, nunca `ngrok` puro (bug conhecido de "Exec format error" no binário do npm em Git Bash).

## 3. Estrutura de pastas (o que procurar onde)

```
backend/
  server.js               ← ponto de entrada, monta TODAS as rotas e middlewares aqui
  database.js             ← conexão Sequelize (SQLite local / Postgres produção)
  middleware/auth.js      ← autenticação JWT + verificação de permissões/plano
  models/                 ← um arquivo por tabela (Sequelize)
  models/index.js         ← ponto único de import de todos os models
  controllers/            ← lógica de cada rota (um arquivo por recurso)
  routes/                 ← definição de endpoints (thin, só chama o controller)
  uploads/                ← fotos enviadas (NÃO versionado, fica só no servidor)

frontend/
  src/pages/               ← telas de nível superior (Login, Dashboard)
  src/components/          ← todo o resto (cada modal/tela é um componente + seu .css)
  src/utils/                ← helpers (formatação de moeda, data, permissões de conta)
  dist/                     ← build de produção, versionado (Railway serve estes arquivos)

scripts/                   ← scripts de migração e utilitários (rodar manualmente, um por vez)
```

### Convenções importantes do código
- **Multi-tenancy**: quase toda tabela tem `veterinarioId`. Toda query de leitura/escrita DEVE filtrar por `req.veterinario.id` (setado pelo middleware `autenticar`). Isso é crítico — veja a seção 6 sobre falhas já corrigidas desse tipo.
- **Idioma**: toda a comunicação com o usuário (e a maioria dos nomes de variável) é em português.
- **CSS não tem módulos** — nomes de classe precisam ser únicos por componente para não vazar estilo entre telas. Existe uma regra global perigosa em `frontend/src/index.css` (`button { width: 100% !important }` em telas < 480px) que quebra qualquer botão-ícone dentro de uma linha flex; ao criar um botão pequeno lado a lado com outro elemento, sempre adicione `width: auto !important` na classe dele (vários exemplos disso no código, buscar por esse comentário).
- **PWA / Service Worker**: `frontend/public/service-worker.js`, estratégia network-first para assets, nunca cacheia `/api/*`.

## 4. Migrations — o que já foi rodado e o que falta

O projeto **não usa `sequelize-cli`**, as migrations são scripts avulsos em `scripts/`, cada um idempotente (podem rodar mais de uma vez sem quebrar — eles checam se a coluna/tabela já existe antes de criar). Rode-os manualmente, **sempre com o backend parado**, na ordem abaixo se estiver configurando um ambiente novo (produção ou uma cópia local nova):

| Ordem | Script | O que faz |
|---|---|---|
| 1 | `scripts/migrate-multitenancy.js` | Adiciona `veterinarioId` nas tabelas antigas |
| 2 | `scripts/migrate-planos.js` | Cria campos de plano/permissões do veterinário |
| 3 | `scripts/migrate-softdelete-foto.js` | Soft-delete (paranoid) + foto de perfil do Pet |
| 4 | `scripts/migrate-hora-nullable.js` | Ajuste de campo hora em Agendamento |
| 5 | `scripts/migrate-dados-cobranca.js` | Campos extras de cobrança |
| 6 | `scripts/migrate-compartilhamento.js` | Cria tabela `compartilhamentos` |
| 7 | `scripts/migrate-precificacao.js` | Campos de precificação no Veiculo/Veterinario |
| 8 | `scripts/migrate-insumos.js` | Cria tabela `insumos` (estoque) |
| 9 | `scripts/migrate-documentos.js` | Cria tabela `documentos_emitidos` |

**Em produção (Railway/Postgres)**: essas mesmas migrations precisam ser rodadas contra o `DATABASE_URL` de produção. Veja `scripts/migrar-dados-producao.js` para o padrão de conexão usado nesses casos.

## 5. Funcionalidades implementadas nesta rodada de trabalho (visão geral)

1. **Módulo de Precificação** (Perfil → Precificação): o veterinário configura custos fixos, pró-labore, horas/semana, ocupação e margem uma única vez; o app calcula a "hora técnica" e usa isso em todo o resto (orçamento, tabela de preços, lucratividade).
2. **Custo/km do veículo**: cálculo correto usando km rodados/mês (não mais o odômetro), incluindo IPVA e rateio por % de uso profissional.
3. **Estoque de Insumos** (Perfil → Estoque de Insumos): CRUD de insumos com unidade livre (texto, não mais lista fixa), abate/reposição de estoque.
4. **Orçamento** (dentro de Clientes → animal, ou pelo FAB): calculadora de "Custo de Visita Externa" (deslocamento) e de "Insumos do Estoque" embutidas no formulário. No PDF final:
   - a visita aparece como **"Deslocamento"** (não mais "Outros"), sempre como último item;
   - os insumos usados aparecem consolidados em uma única linha **"Materiais e insumos"** (o detalhe item a item só fica visível na tela do app, não no PDF do cliente);
   - inclui aviso de que o orçamento é estimado e os valores podem variar.
5. **Botão "Salvar"** no orçamento: grava um histórico de documentos emitidos (Perfil → Documentos Emitidos), com data de emissão e opção de re-gerar o PDF depois.
6. **Compartilhamento de animal entre veterinários**:
   - convite pode ser aceito **dentro do próprio app** (sem precisar de link), se o e-mail já pertencer a uma conta existente — aparece em Clientes → "📨 Convites recebidos";
   - permissão `editar` do compartilhamento agora é **de fato verificada no backend** (antes só existia no banco, sem checagem nenhuma — ver seção 6);
   - dados do proprietário (Cliente: telefone/e-mail/endereço) ficam ocultos para o veterinário convidado — ele só vê o "diário" de atendimentos do animal;
   - o veterinário convidado com permissão de editar agora tem um botão **"+ Novo Atendimento"** dentro do modal de histórico do animal compartilhado, com os mesmos campos de Atendimento Externo/Insumos do agendamento normal.
7. **Agendamento** (NovoAgendamentoModal): dois toggles novos — "🚗 Atendimento Externo" (calcula deslocamento) e "📦 Insumos Usados" (abate estoque) — os valores entram automaticamente no total e na descrição do agendamento, para que quando ele virar Histórico/Cobrança os valores já apareçam discriminados.
8. **Cache instantâneo na Agenda**: os agendamentos/faturamentos ficam em `localStorage`; ao reabrir o app (o iOS descarta a página em segundo plano), a tela aparece na hora com os últimos dados e atualiza em segundo plano, em vez de mostrar "Carregando..." toda vez.

## 6. Correções de segurança aplicadas (importante para quem for auditar depois)

Durante o trabalho, encontramos e corrigimos os seguintes problemas de isolamento entre contas (multi-tenancy):

- **`ConsultaController.js` / `/api/consultas`** — model antigo (`Consulta`, sem coluna `veterinarioId`) que listava/editava/apagava dados de **qualquer conta**, sem filtro nenhum. Confirmado que o frontend nunca usava esse endpoint (substituído por `HistoricoConsulta`) — **removido completamente** (model, controller, rota).
- **`VacinaController.js` / `/api/vacinas`** — mesmo padrão de falha (sem filtro por veterinário) e também sem uso real no frontend — **removido completamente**.
- **Rotas de debug em `backend/routes/anexos.js`** (`/debug/todos`, `/debug/limpar-orphans`, `/debug/force-link/...`) — permitiam a qualquer veterinário comum ler/apagar/religar anexos de **qualquer conta**. Agora exigem `exigirAdmin` (mesmo middleware usado no painel administrativo).
- **Permissão de compartilhamento (`Compartilhamento.permissoes`)** — o campo existia no banco mas nunca era verificado em lugar nenhum do código; qualquer veterinário convidado (mesmo só com "ver") teria, na prática, acesso equivalente. Agora `criarHistorico`/`historicoDoAnimal` verificam corretamente se o veterinário é dono do animal OU tem compartilhamento aceito com permissão `editar` antes de permitir escrita.

Se for fazer uma auditoria de segurança mais completa depois, vale revisar com a mesma lente (busca por `findByPk`/`findAll` sem `where: { veterinarioId: ... }`) os demais controllers — os citados acima foram os únicos confirmados com problema real nesta rodada.

## 7. O que ainda pode ser melhorado (não implementado, ideias para o futuro)

- Adicionar transação (`sequelize.transaction`) no fluxo Agendamento → Histórico → Faturamento (`AgendamentoController.js`, função `atualizarAgendamento`), hoje sem atomicidade — se der erro no meio, o agendamento pode ficar marcado como "Concluído" sem histórico/fatura correspondente.
- A ligação entre Agendamento concluído e o Histórico criado automaticamente é feita por heurística (mesmo pet + tipo + dia), não por uma foreign key `agendamentoId` — pode casar errado se houver dois atendimentos iguais no mesmo dia.
- Considerar paginação nas listagens (`listarHistorico`, `listarFaturamentos`) — hoje trazem tudo de uma vez.

## 8. Contato / dúvidas de negócio

Para entender o "porquê" das decisões de produto (não só o "como" técnico), veja `ESTUDO-MERCADO.md` na raiz do repo — documenta a pesquisa de mercado e a dor principal (gestão financeira/precificação) que motivou boa parte do módulo de Precificação e Estoque de Insumos.
