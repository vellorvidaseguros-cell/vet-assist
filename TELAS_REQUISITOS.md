# REQUISITOS DAS TELAS - VetAssist Mobile & Web

---

## MOBILE (React Native + Expo)

### TELA 1: Login

**Tipo:** Pública (não logado)

**Elementos:**
- Logo VetAssist (topo)
- Email (input)
- Senha (input com visibilidade toggle)
- Botão "Entrar" (principal)
- Link "Criar conta"
- Link "Esqueci minha senha"

**Fluxo:**
1. Usuário digita email e senha
2. Clica "Entrar"
3. Se correto → vai para Home
4. Se incorreto → mostra erro "Email ou senha incorretos"

**Estados:**
- Vazio (botão desabilitado)
- Preenchido (botão ativo)
- Carregando (spinner, botão desabilitado)
- Erro (mensagem vermelha)

---

### TELA 2: Cadastro

**Tipo:** Pública (não logado)

**Elementos:**
- Logo
- Nome (input)
- Email (input)
- Senha (input)
- Confirmar Senha (input)
- Telefone (input com máscara)
- Botão "Criar Conta"
- Link "Já tenho conta"

**Validações:**
- Nome: obrigatório, mín 3 caracteres
- Email: obrigatório, válido
- Senha: obrigatório, mín 8 caracteres, 1 maiúscula, 1 número
- Telefone: obrigatório

**Fluxo:**
1. Preenche formulário
2. Clica "Criar Conta"
3. Se válido → cria conta + faz login automático
4. Se inválido → mostra erro específico

---

### TELA 3: Home (Agenda do Dia)

**Tipo:** Privada (logado)

**Header:**
- Texto "Agenda de Hoje"
- Data do dia atual (ex: "Quarta, 7 de maio")
- Ícone de perfil (canto superior direito)

**Conteúdo Principal:**
- Lista de agendamentos do dia (cards)
- Cada card mostra:
  - Hora em destaque (ex: 09:00)
  - Nome cliente
  - Nome pet
  - Tipo atendimento (Consulta, Vacinação, etc)
  - Status visual (cor: azul=pendente, verde=confirmado)
  - Ícone de más (chevron para abrir detalhes)

**Se não houver agendamentos:**
- Imagem/ícone vazia
- Texto "Nenhum agendamento para hoje"

**Bottom Navigation (Abas):**
1. Home (Agenda) - Ativo
2. Agendamentos (Próximos dias)
3. Clientes
4. Configurações

**Botão Flutuante:**
- Ícone "+" (criar novo agendamento)
- Cor: azul/primária

**Ações ao clicar em agendamento:**
- Abre modal/drawer com detalhes
- Opções: Editar, Marcar como realizado, Cancelar

---

### TELA 4: Agendamentos (Próximos Dias)

**Tipo:** Privada

**Header:**
- Texto "Agendamentos"
- Filtro por status (Todos, Pendente, Confirmado, Realizado)

**Conteúdo:**
- Calendário com bolinhas nos dias que têm agendamentos
- OU List view dos próximos 30 dias
- Agrupado por data
- Cada item:
  - Data (ex: "Sexta, 10 de maio")
  - Cards com agendamentos
  - Mesmas informações do Home

**Filtros:**
- Por status (Todas/Pendentes/Confirmados/Realizados)
- Botão de filtro no topo

**Ações:**
- Clicar em agendamento → detalhes
- Botão "+" → novo agendamento
- Swipe para excluir (opcional)

---

### TELA 5: Detalhes do Agendamento (Modal)

**Tipo:** Modal/Drawer sobre qualquer tela

**Elementos:**
- Botão fechar (X)
- **Cliente:**
  - Nome em destaque
  - Telefone clicável (copy ou chamar)
  - Email
- **Pet:**
  - Nome e espécie
  - Raça, idade (se houver)
- **Agendamento:**
  - Data e hora em destaque
  - Tipo de atendimento
  - Descrição
  - Status com cor
- **Observações:** (campo de texto editável)
- **Botões de ação:**
  - "Editar" (abre formulário)
  - "Marcar Realizado" (muda status)
  - "Cancelar" (delete, pede confirmação)

**Fluxo de Edição:**
- Clica "Editar"
- Campos ficam editáveis
- Muda: data, hora, descrição, observações
- Clica "Salvar"
- Modal fecha, lista atualiza

---

### TELA 6: Criar/Editar Agendamento

**Tipo:** Full screen ou modal grande

**Elementos:**
1. **Seleção de Cliente:**
   - Input com autocomplete/search
   - Lista de clientes
   - OU "Criar novo cliente"
   - Mostra clientes recentes

2. **Seleção de Pet:**
   - Aparece DEPOIS de selecionar cliente
   - Lista pets do cliente
   - OU "Criar novo pet"
   - Mostra pets do cliente

3. **Data:**
   - Date picker (calendário)
   - Mostra apenas datas futuras
   - Pode desabilitar fins de semana (opcional)

4. **Hora:**
   - Time picker
   - Mostra apenas horas disponíveis
   - (Depois de integração pode avisar horários ocupados)

5. **Tipo de Atendimento:**
   - Dropdown com opções:
     - Consulta
     - Vacinação
     - Banho
     - Tosa
     - Cirurgia
     - Exame
     - Limpeza de dentes
     - Outro

6. **Descrição (opcional):**
   - Text area
   - Ex: "Verificar ferimento na pata"

7. **Botões:**
   - "Salvar" (principal, salva agendamento)
   - "Cancelar" (volta anterior)

**Validações:**
- Cliente: obrigatório
- Pet: obrigatório
- Data: obrigatório, futuro
- Hora: obrigatório
- Tipo: obrigatório

---

### TELA 7: Clientes

**Tipo:** Privada

**Header:**
- Texto "Clientes"
- Ícone busca (abre search)
- Input de busca por nome

**Conteúdo:**
- Lista de clientes (alfabética)
- Cada item:
  - Nome em destaque
  - Telefone
  - Número de pets
  - Última consulta (se houver)
  - Seta para abrir detalhes

**Botão "+":**
- Cria novo cliente

**Ações ao clicar:**
- Abre Detalhes do Cliente

---

### TELA 8: Detalhes do Cliente

**Tipo:** Full screen

**Elementos:**
- Nome cliente em destaque (topo)
- Telefone (clicável para copiar/chamar)
- Email
- Endereço
- Data criação
- Data última consulta

**Abas/Seções:**
1. **Informações:**
   - Dados do cliente
   - Botão "Editar"

2. **Pets:**
   - Lista de pets
   - Botão "+" para criar novo
   - Clicar em pet → detalhes

3. **Histórico:**
   - Últimos 10 agendamentos do cliente
   - Data, hora, tipo, status

**Botões de ação:**
- "Editar Cliente" (formulário)
- "Novo Agendamento"
- "Deletar Cliente" (com confirmação)

---

### TELA 9: Criar/Editar Cliente

**Tipo:** Full screen ou modal

**Elementos:**
1. Nome (obrigatório)
2. Telefone (obrigatório, com máscara)
3. Email (opcional)
4. Endereço (opcional)
5. Botões: Salvar, Cancelar

**Fluxo:**
- Clica "Editar" do cliente
- Campos preenchem com dados atuais
- Edita o que precisa
- Clica "Salvar"
- Volta para Detalhes

---

### TELA 10: Criar/Editar Pet

**Tipo:** Modal ou full screen

**Elementos:**
1. Nome (obrigatório)
2. Espécie (obrigatório, dropdown)
3. Raça (opcional)
4. Data de Nascimento (opcional, date picker)
5. Peso (opcional, número)
6. Gênero (opcional, Macho/Fêmea)
7. Botões: Salvar, Cancelar

---

### TELA 11: Configurações

**Tipo:** Privada

**Conteúdo:**
- Dados do veterinário (só leitura)
  - Nome
  - Email
  - Telefone
- Botão "Editar Perfil"
- Botão "Alterar Senha"
- Botão "Sobre o App" (versão)
- Botão "Sair"

**Fluxo de Editar Perfil:**
- Clica "Editar"
- Abre form com Nome, Email, Telefone
- Salva

---

## WEB (React.js Dashboard)

### TELA 1: Login Web

**Design:** Similar ao mobile mas responsivo

**Elementos:**
- Logo VetAssist (topo, maior)
- Painel login (centro)
  - Email, Senha, Entrar
  - Links: Criar conta, Esqueci senha
- Rodapé com versão

---

### TELA 2: Home (Dashboard Principal)

**Tipo:** Privada

**Layout:**
- Sidebar esquerda (navegação)
- Header com usuário
- Conteúdo principal

**Header:**
- Logo VetAssist
- Texto "Bem-vindo, Dr. João"
- Ícone perfil com dropdown (Sair, Configurações)
- Data/hora

**Sidebar (Navegação):**
- Home (Ícone + texto)
- Agendamentos
- Clientes
- Pets
- Configurações
- Sair

**Conteúdo Principal:**
- **Seção 1: Resumo (cards):**
  - Total agendamentos (mês)
  - Total clientes
  - Total pets
  - Taxa conclusão (%)
  - Cada card com número em destaque e ícone

- **Seção 2: Próximos Agendamentos:**
  - Tabela simples
  - Colunas: Hora, Cliente, Pet, Tipo, Status
  - Últimas 10
  - Botão "Ver todos"

- **Seção 3: Clientes Recentes:**
  - Lista simples
  - Últimos 5 cadastrados

---

### TELA 3: Agendamentos (Tabela)

**Tipo:** Privada

**Header:**
- Título "Agendamentos"
- Botão "Novo Agendamento"

**Filtros (topo):**
- Data de início (picker)
- Data fim (picker)
- Status (dropdown: Todas, Pendente, Confirmado, Realizado, Cancelado)
- Botão "Filtrar"
- Botão "Limpar filtros"

**Tabela:**
- Colunas: Data, Hora, Cliente, Pet, Tipo, Status, Ações
- Cada linha:
  - Checkbox (para ações em massa, depois)
  - Cores por status
  - Ícones de ação (editar, deletar, detalhes)
- Paginação (10-50 itens por página)

**Ações por linha:**
- Editar
- Ver detalhes
- Marcar como realizado
- Cancelar
- Deletar

---

### TELA 4: Detalhes Agendamento (Web)

**Tipo:** Modal ou página completa

**Elementos:**
- Cliente (nome em destaque)
- Pet
- Data e hora
- Tipo atendimento
- Descrição
- Observações (editável inline)
- Status com cores
- Histórico (quando foi criado, modificado)

**Botões:**
- Editar
- Marcar realizado
- Cancelar
- Voltar

---

### TELA 5: Criar/Editar Agendamento (Web)

**Tipo:** Página ou modal grande

**Elementos:**
1. Cliente (dropdown com search)
2. Pet (dropdown, preenchido depois de cliente)
3. Data (date picker)
4. Hora (time picker)
5. Tipo (dropdown)
6. Descrição (textarea)
7. Observações (textarea)
8. Status (dropdown)
9. Botões: Salvar, Cancelar

**Validação em tempo real:**
- Campo obrigatório vazio → borda vermelha + mensagem

---

### TELA 6: Clientes (Tabela Web)

**Tipo:** Privada

**Header:**
- Título "Clientes"
- Botão "Novo Cliente"

**Filtros:**
- Busca por nome
- Data criação (range)
- Botão Filtrar

**Tabela:**
- Colunas: Nome, Telefone, Email, Pets, Última Consulta, Ações
- Paginação
- Ícones de ação (editar, deletar, ver detalhes)

---

### TELA 7: Detalhes Cliente (Web)

**Tipo:** Página completa ou modal

**Abas:**
1. **Informações:**
   - Dados: Nome, Telefone, Email, Endereço
   - Botão Editar
   - Botão Deletar

2. **Pets:**
   - Tabela com pets
   - Colunas: Nome, Espécie, Raça, Idade
   - Botão "Novo Pet"
   - Ícones editar/deletar

3. **Histórico:**
   - Tabela com últimos agendamentos
   - Colunas: Data, Hora, Pet, Tipo, Status
   - Botão "Ver todos"

---

### TELA 8: Relatórios (Futuro, mas deixar espaço)

**Tipo:** Privada

**Elementos:**
- Gráfico de agendamentos (mês)
- Gráfico de tipos de atendimento
- Tabela de estatísticas
- Filtro por período

---

## DESIGN GERAL

### Cores Sugeridas:
- **Primária:** Azul (#007AFF ou similar)
- **Secundária:** Verde (#34C759)
- **Sucesso:** Verde
- **Erro:** Vermelho (#FF3B30)
- **Aviso:** Laranja (#FF9500)
- **Status Pendente:** Amarelo
- **Status Confirmado:** Verde
- **Status Realizado:** Cinza
- **Status Cancelado:** Vermelho

### Typography:
- **Títulos:** Bold, 24px+
- **Subtítulos:** Semibold, 18px
- **Corpo:** Regular, 14-16px
- **Labels:** Medium, 12px

### Componentes Reutilizáveis:
- Button (primary, secondary, danger)
- Input (text, email, password, date, time)
- Dropdown/Select
- Modal/Dialog
- Card
- Badge (para status)
- Avatar (para usuário)

### Responsividade:
- **Mobile:** < 768px
- **Tablet:** 768px - 1024px
- **Desktop:** > 1024px

---

## FLUXOS DE NAVEGAÇÃO

### Mobile:
```
Login → Home → (Botão +) → Criar Agendamento → Home
                ↓
            Agendamentos
                ↓
            Detalhes → Editar → Salvar
                ↓
            Clientes
                ↓
            Detalhes Cliente → Pets → Criar Pet
```

### Web:
```
Login → Dashboard (Home) → Agendamentos → Criar/Editar
                           ↓
                       Clientes → Detalhes → Pets
                           ↓
                       Relatórios
```

---

## RESUMO DAS TELAS

**Mobile:** 11 telas principais  
**Web:** 8 telas principais  
**Modais/Componentes:** 5+

**Total de telas/fluxos:** ~25

