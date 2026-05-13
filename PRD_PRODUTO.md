# PRD (Product Requirements Document) - VetAssist

**Versão:** 1.0  
**Data:** 2026-05-07  
**Status:** Em Revisão

---

## 1. VISÃO DO PRODUTO

### O que é?
VetAssist é um aplicativo de gestão de agenda e agendamentos para clínicas veterinárias.

**Objetivo:** Veterinários gerenciarem sua rotina (clientes, pets, agendamentos) de forma simples e rápida via mobile e web.

### Para quem?
- Veterinários (usuários principais)
- Clínicas veterinárias pequenas e médias
- Profissionais autônomos

### Por quê agora?
Veterinários gastam tempo com:
- Anotações em papel
- Planilhas desorganizadas
- Falta de visualização de agenda
- Falta de histórico de clientes/pets

VetAssist **centraliza tudo** em um lugar.

---

## 2. FEATURES DO MVP

### 2.1 Autenticação

**Feature:** Login/Cadastro

**Requisitos:**
- Veterinário se cadastra com email + senha
- Faz login com email + senha
- Recuperação de senha via email
- JWT para manter logado

**Fluxo:**
```
1. Veterinário acessa app
2. Vê tela de login
3. Clica "Não tenho conta"
4. Preenche: Email, Senha, Nome, Telefone
5. Clica "Criar conta"
6. Sistema cria conta e faz login automático
7. Vai para Home (Agenda)
```

**Casos de sucesso:**
- ✅ Cadastro com dados válidos
- ✅ Login com email/senha corretos
- ✅ Recuperação de senha

**Casos de erro:**
- ❌ Email já existe → "Email já cadastrado"
- ❌ Senha fraca → "Senha deve ter 8+ caracteres"
- ❌ Email inválido → "Email inválido"
- ❌ Login incorreto → "Email ou senha incorretos"

---

### 2.2 Home (Agenda do Dia)

**Feature:** Ver agenda do dia

**Requisitos:**
- Mostra agendamentos de **hoje**
- Ordenado por horário
- Mostra: hora, cliente, pet, tipo de atendimento
- Botão para criar novo agendamento
- Swipe para próximo dia / dia anterior (opcional)

**Fluxo:**
```
1. Veterinário abre app
2. Vê a Home (Agenda de Hoje)
3. Vê lista de agendamentos:
   - 09:00 - João + Rex (Consulta)
   - 10:30 - Maria + Bilu (Vacinação)
   - 14:00 - Ana + Miau (Banho)
4. Pode clicar em cada agendamento para ver detalhes
5. Pode criar novo clicando em "+"
```

**Design:**
- Card simples por agendamento
- Hora em destaque
- Nome cliente + pet
- Tipo de atendimento
- Status visual (pendente/confirmado/realizado)

---

### 2.3 Cadastro de Clientes

**Feature:** Gerenciar clientes (CRUD)

**Requisitos:**
- Criar novo cliente (nome, telefone, email, endereço)
- Ver lista de clientes
- Editar cliente
- Deletar cliente
- Buscar cliente por nome

**Fluxo:**
```
1. Vai em "Clientes"
2. Vê lista de todos os clientes cadastrados
3. Clica "+" para criar novo
4. Preenche: Nome, Telefone, Email, Endereço
5. Clica "Salvar"
6. Cliente aparece na lista
```

**Dados do Cliente:**
- ID (auto)
- Nome (obrigatório)
- Telefone (obrigatório)
- Email (opcional)
- Endereço (opcional)
- Data criação (auto)
- Data última consulta (auto)

---

### 2.4 Cadastro de Pets

**Feature:** Gerenciar pets (CRUD)

**Requisitos:**
- Criar pet vinculado a cliente
- Ver pets de um cliente
- Editar pet
- Deletar pet
- Mostrar histórico de atendimentos do pet

**Fluxo:**
```
1. Vai em "Clientes"
2. Clica em um cliente (ex: João)
3. Vê lista de pets do João
4. Clica "+" para criar novo pet
5. Preenche: Nome, Espécie, Raça, Data Nascimento
6. Clica "Salvar"
7. Pet aparece vinculado a João
```

**Dados do Pet:**
- ID (auto)
- ID_Cliente (referência)
- Nome (obrigatório)
- Espécie (cão, gato, etc) (obrigatório)
- Raça (opcional)
- Data nascimento (opcional)
- Peso (opcional)
- Data criação (auto)

---

### 2.5 Criar Agendamento

**Feature:** Agendar consulta

**Requisitos:**
- Selecionar cliente
- Selecionar pet (do cliente)
- Escolher data
- Escolher hora
- Adicionar descrição (opcional)
- Salvar

**Fluxo:**
```
1. Na Home ou em "Agendamentos", clica "+"
2. Seleciona cliente (autocomplete/lista)
3. Sistema mostra pets daquele cliente
4. Seleciona o pet
5. Escolhe data (calendário)
6. Escolhe hora (picker)
7. Adiciona tipo de atendimento (Consulta, Vacinação, Banho, etc)
8. Salva
9. Agendamento aparece na Home
```

**Dados do Agendamento:**
- ID (auto)
- ID_Cliente (obrigatório)
- ID_Pet (obrigatório)
- Data (obrigatório)
- Hora (obrigatório)
- Tipo_Atendimento (Consulta, Vacinação, Banho, Cirurgia, etc)
- Descrição (opcional)
- Status (pendente/confirmado/realizado/cancelado)
- Data criação (auto)

---

### 2.6 Ver/Editar Agendamento

**Feature:** Gerenciar agendamento individual

**Requisitos:**
- Ver detalhes de um agendamento
- Editar data/hora/descrição
- Marcar como "Realizado"
- Cancelar agendamento
- Ver histórico de atendimentos do pet

**Fluxo:**
```
1. Na Home, clica em um agendamento
2. Vê detalhes:
   - Cliente
   - Pet
   - Data/Hora
   - Tipo atendimento
   - Descrição
   - Status
3. Pode editar ou cancelar
4. Se clicar "Realizado", marca como concluído
```

---

### 2.7 Lista de Agendamentos (Próximos Dias)

**Feature:** Ver agenda futura

**Requisitos:**
- Ver agendamentos dos próximos 7-30 dias
- Filtrar por status
- Ordenado por data/hora
- Visualizar em formato lista ou calendário (opcional)

**Fluxo:**
```
1. Vai em "Agendamentos"
2. Vê lista de próximos agendamentos
3. Pode filtrar por status (pendente, confirmado, realizado)
4. Clica em um para editar
```

---

### 2.8 Dashboard (Web)

**Feature:** Visão geral da rotina (Web apenas)

**Requisitos:**
- Total de agendamentos (mês)
- Total de clientes
- Total de pets
- Agendamentos realizados vs marcados
- Próximos agendamentos (próximas 24h)

**Fluxo:**
```
1. Acessa https://app.vetassist.com/dashboard
2. Vê gráficos e números
3. Pode filtrar por período
```

---

## 3. ROADMAP

### MVP (v1.0) - Semanas 1-3
- ✅ Autenticação (login/cadastro)
- ✅ Home (agenda do dia)
- ✅ Cadastro de clientes
- ✅ Cadastro de pets
- ✅ Criar agendamento
- ✅ Ver/editar agendamento
- ✅ Dashboard básico
- ✅ Testes com veterinário real

### v1.1 - Depois (Semanas 4-6)
- ⏳ Integração com Stripe (cobrança)
- ⏳ Integração com Z-API (WhatsApp)
- ⏳ Lembretes automáticos
- ⏳ Relatórios detalhados
- ⏳ Exportar dados

### v2.0 - Futuro
- ⏳ IA para sugerir horários
- ⏳ Integração com calendário (Google Calendar, Outlook)
- ⏳ Video consulta
- ⏳ Medicamentos e receitas
- ⏳ Multi-profissional (equipe de veterinários)

---

## 4. ESPECIFICAÇÕES TÉCNICAS

### Mobile
- **Framework:** React Native + Expo
- **Autenticação:** JWT
- **State Management:** Context API ou Redux
- **HTTP Client:** Axios
- **Plataformas:** iOS + Android

### Web
- **Framework:** React.js
- **Autenticação:** JWT
- **State Management:** Context API ou Redux
- **HTTP Client:** Axios
- **Hospedagem:** Vercel

### Backend
- **Framework:** Node.js + Express
- **Banco:** PostgreSQL
- **Autenticação:** JWT
- **ORM:** Sequelize ou TypeORM
- **Hospedagem:** Heroku, Railway, ou similar

---

## 5. MÉTRICAS DE SUCESSO

**Quando o MVP está pronto, validar:**

- ✅ Veterinário consegue criar conta em < 2 minutos
- ✅ Consegue agendar consulta em < 1 minuto
- ✅ App não trava com 100 agendamentos
- ✅ Gera valor (economiza tempo vs. planilha)
- ✅ Interface é intuitiva (sem tutorial)
- ✅ Quer pagar por isso (validação de preço)

---

## 6. RESTRIÇÕES E LIMITAÇÕES

### MVP NÃO tem:
- ❌ Cobrança/pagamento (v1.1)
- ❌ WhatsApp automático (v1.1)
- ❌ Lembretes (v1.1)
- ❌ Múltiplos veterinários na mesma conta
- ❌ Sincronização offline
- ❌ IA/ML

### MVP SIM tem:
- ✅ Agendamentos simples
- ✅ Cadastro de clientes/pets
- ✅ Dashboard básico
- ✅ Autenticação segura
- ✅ Histórico de atendimentos

---

## 7. ASSINATURA (Implementado depois com Stripe)

**Por enquanto:**
- Todos os usuários têm acesso ilimitado
- Sem bloqueio de features
- Sem pagamento

**Depois (v1.1):**
- Sistema detecta se assinatura está ativa
- Se expirar → bloqueia login
- Diferentes planos (Básico, Pro, Enterprise)

