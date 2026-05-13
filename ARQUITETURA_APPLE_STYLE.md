# 🎯 Arquitetura Apple-Style - VetAssist

**Data**: 13 de maio de 2026  
**Status**: Pronto para implementação  
**Prioridade**: Fase 1 - Home Minimalista

---

## 📌 Princípio Guia

> **"O app é para executar. A web é para gerenciar."**

---

## 🎨 Visão Geral

Transformar o VetAssist Mobile em uma **central de execução rápida** para veterinários, inspirado no design minimalista da Apple.

### Diretrizes Principais

- ✅ **Mobile First**: Mobile é prioridade, web mantém funcionalidade completa
- ✅ **Today-Centric**: Home mostra apenas "hoje" por padrão
- ✅ **Regra dos 3 Cliques**: Qualquer ação essencial em máximo 3 cliques
- ✅ **Zero Poluição Visual**: Mostrar apenas o essencial
- ✅ **Gestos Opcionais**: Swipes e toque longo são atalhos, não caminho obrigatório

---

## 📐 Arquitetura de Navegação Mobile

### Bottom Navigation (4 Abas Principais)

```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│     📅       │      👥      │      💰      │      👤      │
│   Agenda     │   Clientes   │  Cobranças   │    Perfil    │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

### Hierarquia de Navegação

```
HOME (Today-Centric)
│
├─ 📅 AGENDAMENTOS
│  ├─ Hoje (padrão)
│  ├─ Amanhã
│  ├─ Semana
│  └─ Calendário
│
├─ 👥 CLIENTES
│  ├─ Busca rápida
│  ├─ Lista com resumo
│  └─ [Clique] → Resumo cliente + Pets
│
├─ 💰 COBRANÇAS
│  ├─ Apenas pendentes
│  └─ [Clique] → Marcar pago
│
└─ 👤 PERFIL
   └─ Settings básicos
```

---

## 🏠 Estrutura da Home (Today-Centric)

### Layout Visual

```
┌─────────────────────────────────────────┐
│  VetAssist                        12:30  │
├─────────────────────────────────────────┤
│                                         │
│  📅 HOJE - Segunda, 12 de maio          │
│                                         │
│  [  Próximos  ][  Amanhã  ][  Semana  ]│  ← Abas
│                                         │
│  ⏰ 10:30                                │
│  🐱 Gato - Vacinação                     │
│  João Silva                             │
│  R$ 250 - Pendente                      │
│  [Confirmar] [Histórico]                │
│                                         │
│  ⏰ 12:00                                │
│  🐕 Cachorro - Banho + Tosa              │
│  Maria Santos                           │
│  R$ 180 - Pago                          │
│  [Finalizar]                            │
│                                         │
│  ⏰ 14:30                                │
│  🦜 Pássaro - Consulta                   │
│  Pedro Costa                            │
│  R$ 150 - Pendente                      │
│  [Confirmar] [Histórico]                │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  ⚠️ PENDÊNCIAS                           │
│                                         │
│  💰 R$ 1.250 em cobranças                │
│  [Ver todas]                            │
│                                         │
│  🔔 2 retornos a agendar                │
│  [Ver todos]                            │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  🔍 BUSCAR                               │
│  [Buscar cliente, pet, consulta...]     │
│                                         │
│              ┌─────────────────┐        │
│              │  📅 Agendamento │        │
│              │  👤 Novo Cliente│        │ ← FAB (4 ações)
│              │  💰 Cobrança    │        │
│              │      ➕         │        │
│              └─────────────────┘        │
│                                         │
└─────────────────────────────────────────┘
```

### Componentes da Home

1. **Header**: Data, hora, logo
2. **Abas**: Próximos, Amanhã, Semana
3. **Agendamentos**: Cards simples (Hora, Pet, Tutor, Valor, Status, Botão)
4. **Pendências**: Resumo cobranças + retornos
5. **Busca**: Search bar para filtro rápido
6. **FAB**: 4 ações principais

---

## ✂️ Telas Removidas/Simplificadas do Mobile

### ❌ Completamente Removidas

```
❌ Dashboard com 5 cards resumo (Recebido, A Receber, Gastos, Resultado)
❌ Gráfico de Pizza (GastosCategoriaPieChartCard + Modal)
❌ Histórico de Pagamentos detalhado
❌ Lista completa de agendamentos do mês
❌ Detalhes completos de cliente com formulários
❌ Seção de Financeiro completa (tabelas, gráficos)
```

### 📉 Simplificadas

```
📅 AGENDAMENTOS
  Antes: Lista com 5+ colunas
  Depois: Card simples (Hora, Pet, Tutor, Valor, Status, Botão)

👥 CLIENTES
  Antes: Accordion com formulários
  Depois: Lista resumida (Nome, Telefone, Últimos Pets)

💰 COBRANÇAS
  Antes: Tabela detalhada
  Depois: Card simples (Cliente, Valor, Data, Status, Botão)

🐾 HISTÓRICO
  Antes: Timeline com fotos
  Depois: Resumo simplificado (últimos 5 agendamentos)
```

---

## 🎯 Fluxos de 3 Cliques

### Ação 1: Ver Agenda de Hoje
```
1. Abrir app → Home carrega com "Hoje"
Pronto! ✅ (1 clique, aparece automaticamente)
```

### Ação 2: Criar Nova Consulta
```
1. Toque no botão ➕ (FAB)
   → Expande mostrando 4 opções

2. Toque "📅 Nova Consulta"
   → Abre formulário simplificado

3. Preenche (cliente, horário, tipo, valor)
   → Salva e volta para home
Pronto! ✅
```

### Ação 3: Marcar Pagamento como Recebido
```
1. Toque em "💰 Cobranças" (bottom nav)

2. Encontra o cliente na lista
   (ou busca rápida)

3. Toque em "[Marcar Pago]"
   → Confirma e atualiza
Pronto! ✅
```

### Ação 4: Buscar Cliente Específico
```
1. Toque em "🔍 BUSCAR" (home)
   ou toque em "👥 Clientes" (bottom nav)

2. Digita nome do cliente

3. Toque no resultado
   → Abre resumo do cliente
Pronto! ✅
```

### Ação 5: Ver Histórico de um Pet
```
1. Toque em "👥 Clientes" (bottom nav)

2. Seleciona o cliente
   → Mostra lista de pets

3. Toque no pet
   → Abre histórico simplificado
Pronto! ✅
```

### Ação 6: Confirmar Consulta
```
1. Home mostra agenda de hoje

2. Encontra a consulta "Pendente"

3. Toque "[Confirmar]"
   → Atualiza status
Pronto! ✅
```

---

## 🔄 Divisão App vs Web

### 🎯 Fica APENAS no Mobile

```
❌ FAB com 4 ações rápidas
❌ Home minimalista de "hoje"
❌ Abas de navegação (Hoje, Amanhã, Semana)
❌ Cards compactos de agendamento
❌ Busca rápida na home
```

### 💻 Fica APENAS na Web

```
✅ Dashboard com cards resumo financeiro
✅ Gráfico de pizza de gastos por categoria
✅ Relatórios completos (mês, trimestre, ano)
✅ Histórico detalhado com fotos
✅ Configurações de conta e integração
✅ Exportações (PDF, Excel)
✅ Templates de mensagens
✅ Gestão financeira completa (fluxo de caixa, custos)
✅ Configurações de WhatsApp
✅ Configurações de cobrança automática
✅ Análises e métricas avançadas
```

### 🔁 Existe em Ambos (Mas Diferentes)

```
📅 AGENDAMENTOS
  Mobile: Cards simples, focado em "hoje"
  Web: Tabela completa, calendário, filtros avançados

👥 CLIENTES
  Mobile: Resumo simples, busca rápida
  Web: Perfil completo, histórico de transações, edição completa

💰 COBRANÇAS
  Mobile: Apenas pendentes, botão "Marcar Pago"
  Web: Todas, com histórico, relatórios, automação

🐾 HISTÓRICO
  Mobile: Resumo (últimas 5 consultas)
  Web: Timeline completa com fotos, documentos, PDFs

👤 PERFIL
  Mobile: Settings básicos
  Web: Gestão completa da conta
```

---

## 🎭 Gestures (Fase Posterior - Fase 3)

### Gestures Que Implementaremos Depois

```
🔄 Swipe Left
  → Ver histórico do pet
  ⚠️ Também terá botão: [Histórico]

🔄 Swipe Right
  → Editar consulta
  ⚠️ Também terá botão: [Editar]

🔄 Swipe Down
  → Marcar como concluído
  ⚠️ Também terá botão: [Finalizar]

👆 Toque Longo
  → Menu de ações rápidas
  ⚠️ Também existirá como botões visíveis

🔍 Duplo Toque
  → Marcar como favorito (clientes frequentes)
  ⚠️ Também terá ícone de favorito
```

### Regra Importante

```
❌ NUNCA esconder ação importante atrás de gesto
✅ SEMPRE ter botão visível como caminho principal
✅ Gestos são apenas atalhos para usuários avançados
```

---

## 📊 Roadmap de Implementação

### 🟢 FASE 1 — Mobile Minimalista (2-3 semanas)

**Prioridade Máxima:**

- [ ] Redesenhar Home mostrando apenas essencial
  - [ ] Remover cards resumo (Recebido, A Receber, Gastos, Resultado)
  - [ ] Focar em "HOJE" (próximas consultas)
  - [ ] Mostrar pendências (cobranças + retornos)
  - [ ] Busca rápida na home

- [ ] Criar FAB principal com 4 ações
  - [ ] Nova Consulta
  - [ ] Novo Cliente/Pet
  - [ ] Nova Cobrança
  - [ ] Novo Lembrete

- [ ] Criar cards simples de agendamento
  - [ ] Nome do pet
  - [ ] Nome do tutor
  - [ ] Horário
  - [ ] Status
  - [ ] Ação rápida visível

- [ ] Remover gráficos da Home mobile
  - [ ] Deletar GastosCategoriaPieChartCard (mobile)
  - [ ] Deletar GastosCategoriaPieChartModal (mobile)
  - [ ] Manter na web

- [ ] Criar busca rápida
  - [ ] Cliente
  - [ ] Pet
  - [ ] Consulta
  - [ ] Cobrança

- [ ] Criar fluxo de nova consulta em 3 cliques

- [ ] Criar pendências simples
  - [ ] Consultas sem confirmação
  - [ ] Cobranças pendentes
  - [ ] Retornos a lembrar

### 🟡 FASE 2 — Detalhes Progressivos (2-3 semanas)

Depois da Fase 1, implementar:

- [ ] Bottom sheets para detalhes rápidos
- [ ] Edição rápida de consulta
- [ ] Detalhe do cliente/pet sem sair da rotina
- [ ] Ações contextuais visíveis
- [ ] Histórico simples por cliente/pet
- [ ] Resumo financeiro simplificado

### 🟠 FASE 3 — Gestos como Atalhos Opcionais (1-2 semanas)

Somente depois implementar:

- [ ] Swipe para marcar pago
- [ ] Swipe para confirmar consulta
- [ ] Swipe para marcar como faltou
- [ ] Toque longo para ações rápidas
- [ ] Atalhos avançados

---

## 🔧 Arquivos que Vão Mudar

### Criações Novas (Fase 1)

```
frontend/src/components/
├── MobileHome.jsx (Home minimalista)
├── MobileHome.css
├── FAB.jsx (Floating action button)
├── FAB.css
├── MobileAgendamentosCard.jsx (Card simples)
├── MobileAgendamentosCard.css
├── MobileClientesList.jsx (Lista resumida)
├── MobileClientesList.css
├── MobileCobrancasList.jsx (Cobranças pendentes)
├── MobileCobrancasList.css
└── MobileSearch.jsx (Busca rápida)
```

### Modificações (Fase 1)

```
frontend/src/components/
├── Dashboard.jsx (adicionar layout mobile diferente)
├── Sidebar.jsx (converter para bottom navigation em mobile)
├── Financeiro.jsx (manter apenas na web)
└── [outros componentes] (adaptar para mobile)

frontend/src/pages/
└── Dashboard.css (adicionar media queries agressivas)
```

### Remoções (Fase 1 - Mobile Only)

```
❌ GastosCategoriaPieChartCard.jsx (mobile)
❌ GastosCategoriaPieChartModal.jsx (mobile)
(Mantém na web)
```

---

## 📋 Checklist de Implementação

### Fase 1 - Home Minimalista

- [ ] Criar componentes novos (MobileHome, FAB, Cards)
- [ ] Redesenhar home para Today-Centric
- [ ] Remover gráficos da home
- [ ] Implementar FAB com 4 ações
- [ ] Criar busca rápida
- [ ] Testar 3 cliques em cada ação principal
- [ ] Verificar responsividade (375px a 768px)
- [ ] Remover erros de console
- [ ] Documentar componentes novos

### Fase 2 - Detalhes Progressivos

- [ ] Bottom sheets
- [ ] Histórico simplificado
- [ ] Edição inline
- [ ] Testes em 3 devices diferentes

### Fase 3 - Gestos Opcionais

- [ ] Detector de swipe
- [ ] Implementar 5 gestures
- [ ] Sempre com botão visível como fallback
- [ ] Testes de usabilidade

---

## 🎯 Sucesso = Quando...

✅ **Home carrega em <2 segundos**
✅ **Qualquer ação em máximo 3 cliques**
✅ **Zero gráficos na home mobile**
✅ **FAB sempre visível e acessível**
✅ **Busca funciona em 1 clique**
✅ **Responsive em 375px a 1920px**
✅ **Sem erros de console**
✅ **Veterinário consegue fazer tudo do celular**

---

## 📞 Dúvidas Frequentes

**P: E os gráficos de pizza?**  
R: Saem do mobile, ficam na web. Veterinário não precisa deles no app.

**P: E o histórico de consultas?**  
R: Simplificado no mobile (últimas 5), completo na web.

**P: E se o veterinário quiser filtros avançados?**  
R: Na web. App é para ação rápida, web é para análise.

**P: E os gestos?**  
R: Depois (Fase 3). Primeiro: botões visíveis. Depois: gestos como atalhos.

---

**Versão**: 1.0  
**Data**: 13 de maio de 2026  
**Status**: Pronto para Fase 1  
**Próximo Dev**: Seguir checklist acima
