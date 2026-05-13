# ARQUITETURA COMPLETA DO MVP HÍBRIDO - VetAssist

---

## 1. VISÃO GERAL ARQUITETURAL

### Fluxo de Dados Simplificado

```
┌─────────────────┐
│  Veterinário    │
│   (WhatsApp)    │
└────────┬────────┘
         │
         │ Mensagem de texto
         │
┌────────▼────────┐
│   Z-API         │ Recebe e envia mensagens
│ (WhatsApp API)  │
└────────┬────────┘
         │
         │ JSON estruturado
         │
┌────────▼──────────────┐
│   Make.com            │ Orquestra toda a lógica
│  (Automation Hub)     │
└────────┬──────────────┘
         │
    ┌────┴─────────────────────────┐
    │                              │
┌───▼──────────┐        ┌─────────▼────┐
│ Google Sheets│        │   Asaas      │
│ (Banco Dados)│        │ (PIX/Cobrança)│
└──────────────┘        └──────────────┘
    │                         │
    └────────────┬────────────┘
                 │
         Webhook/Atualização
                 │
         ┌───────▼────────┐
         │ Resposta Cliente│
         │   (WhatsApp)   │
         └────────────────┘
```

---

## 2. COMPONENTES PRINCIPAIS

### 2.1 Z-API (Receptor e Transmissor)

**O que é:**
- API que conecta ao WhatsApp Business
- Recebe mensagens do veterinário
- Envia mensagens aos clientes

**Responsabilidades:**
- ✅ Receber mensagens do veterinário
- ✅ Enviar mensagens para clientes
- ✅ Enviar notificações ao veterinário
- ✅ Webhook de entrada (trigga Make)

**Fluxo:**
```
Veterinário digita no WhatsApp
         ↓
Z-API recebe a mensagem
         ↓
Z-API envia webhook para Make
         ↓
Make processa
         ↓
Make pede para Z-API enviar resposta
         ↓
Z-API envia mensagem de volta
```

**Dados que trafegam:**
```json
{
  "from": "5511987654321",
  "message": "Cobrar 250 do João pela consulta do Rex",
  "timestamp": "2026-05-07T14:30:00Z"
}
```

---

### 2.2 Make.com (Orquestrador)

**O que é:**
- Plataforma de automação (tipo Zapier, mas melhor para este caso)
- Conecta todas as ferramentas
- Executa a lógica do sistema

**Responsabilidades:**
- ✅ Receber webhook da Z-API
- ✅ Interpretar mensagens (extrair valor, cliente, descrição)
- ✅ Buscar dados no Google Sheets
- ✅ Chamar Asaas para criar PIX
- ✅ Atualizar Google Sheets
- ✅ Pedir Z-API para enviar mensagens
- ✅ Receber webhook do Asaas (pagamento confirmado)
- ✅ Tratar erros

**Como funciona:**
Make é como um "maestro" que:
1. Ouve a entrada (webhook Z-API)
2. Executa passos em sequência (módulos)
3. Toma decisões (filtros)
4. Chama outras APIs (Asaas, Google Sheets)
5. Controla fluxos (repetição, condições)

---

### 2.3 Asaas (Gerador de Cobrança)

**O que é:**
- Plataforma de pagamentos brasileira
- Cria cobranças/faturas
- Gera link PIX
- Confirma pagamentos

**Responsabilidades:**
- ✅ Criar cobrança com valor + cliente
- ✅ Gerar link PIX
- ✅ Retornar ID da cobrança
- ✅ Enviar webhook quando pagamento chegar

**Dados que trafegam:**
```json
{
  "billingType": "PIX",
  "value": 250.00,
  "customer": "João Silva",
  "description": "Consulta do Rex",
  "dueDate": "2026-05-10"
}
```

**Resposta:**
```json
{
  "id": "cob_123456789",
  "pixKey": "00020126580...",
  "paymentLink": "https://asaas.com/p/..."
}
```

---

### 2.4 Google Sheets (Banco de Dados)

**O que é:**
- Planilha simples para armazenar dados
- Funciona como banco de dados inicial (depois pode migrar)
- Fácil de visualizar e manipular

**Responsabilidades:**
- ✅ Armazenar clientes
- ✅ Armazenar pets
- ✅ Armazenar agendamentos
- ✅ Armazenar cobranças
- ✅ Armazenar pagamentos
- ✅ Armazenar logs

**Como funciona:**
Make lê e escreve no Sheets como se fosse um banco de dados comum.

---

## 3. FLUXOS DO MVP

### FLUXO 1: COBRANÇA PIX (Prioridade Máxima)

#### Cenário: Criação da Cobrança

```
ENTRADA:
"Cobrar 250 do João pela consulta do Rex"

PASSO 1: Z-API recebe
├─ De: 5511987654321
├─ Mensagem: "Cobrar 250 do João pela consulta do Rex"
└─ Webhook → Make

PASSO 2: Make - Interpretar mensagem
├─ Extrai valor: 250
├─ Extrai cliente: João
├─ Extrai descrição: consulta do Rex
├─ Converte 250 → 250.00 (formato Asaas)
└─ Busca cliente no Google Sheets

PASSO 3: Make - Validar/Criar cliente
├─ SE cliente existe no Sheets
│  └─ Usa ID existente
├─ SE cliente não existe
│  ├─ Cria cliente no Sheets com nome + telefone
│  └─ Gera ID automático
└─ Continua fluxo

PASSO 4: Make - Chamar Asaas
├─ Envia:
│  ├─ Valor: 250.00
│  ├─ Nome cliente: João
│  ├─ Descrição: Consulta do Rex
│  └─ Tipo: PIX
├─ Asaas responde com:
│  ├─ ID: cob_123456
│  └─ Link PIX: https://asaas.com/p/...
└─ Armazena ID para futura referência

PASSO 5: Make - Registrar no Google Sheets
├─ Aba: Cobranças
├─ Campos:
│  ├─ ID_Cobranca: COB_001
│  ├─ ID_Cliente: C_001
│  ├─ Valor: 250.00
│  ├─ Descrição: Consulta do Rex
│  ├─ Status: pendente
│  ├─ ID_Asaas: cob_123456
│  ├─ Link_PIX: https://asaas.com/p/...
│  └─ Data_Criacao: 2026-05-07 14:30
└─ Salva no Sheets

PASSO 6: Make - Enviar mensagem ao cliente
├─ Pede Z-API para enviar:
│  "João, uma cobrança de R$ 250,00 foi gerada."
│  "Descrição: Consulta do Rex"
│  "Link: https://asaas.com/p/..."
│  "Clique para pagar."
└─ Z-API envia para 5511987654321

PASSO 7: Make - Avisar veterinário
├─ Pede Z-API para enviar:
│  "✅ Cobrança criada!"
│  "Cliente: João"
│  "Valor: R$ 250,00"
│  "Status: Aguardando pagamento"
└─ Z-API envia para veterinário

FIM DO FLUXO DE CRIAÇÃO
```

#### Cenário: Confirmação de Pagamento

```
ENTRADA:
Webhook do Asaas: "Pagamento de cob_123456 confirmado"

PASSO 1: Asaas envia webhook
├─ Evento: payment_confirmed
├─ ID_Cobranca: cob_123456
├─ Valor: 250.00
└─ Webhook → Make

PASSO 2: Make - Buscar cobrança no Sheets
├─ Procura por ID_Asaas = cob_123456
└─ Encontra: COB_001

PASSO 3: Make - Atualizar status no Sheets
├─ Aba: Cobranças
├─ Linha: COB_001
├─ Muda Status: pendente → pago
├─ Registra Data_Pagamento: 2026-05-07 14:35
└─ Salva

PASSO 4: Make - Criar registro na aba Pagamentos
├─ ID_Pagamento: PAG_001
├─ ID_Cobranca: COB_001
├─ Valor_Pago: 250.00
├─ Data_Pagamento: 2026-05-07 14:35
├─ Status: confirmado
└─ Salva no Sheets

PASSO 5: Make - Avisar veterinário
├─ Pede Z-API para enviar:
│  "✅ PAGAMENTO CONFIRMADO!"
│  "Cliente: João"
│  "Valor: R$ 250,00"
│  "Status: Pago"
└─ Z-API envia

PASSO 6: Make - Enviar confirmação ao cliente (opcional)
├─ Pede Z-API para enviar:
│  "Obrigado! Seu pagamento foi confirmado."
└─ Z-API envia

FIM DO FLUXO DE PAGAMENTO
```

---

### FLUXO 2: AGENDAMENTO

```
ENTRADA:
"Agendar Rex sexta às 10h para Ana"

PASSO 1: Z-API recebe
├─ Webhook → Make

PASSO 2: Make - Interpretar
├─ Pet: Rex
├─ Data: sexta (próxima sexta)
├─ Hora: 10h
├─ Cliente: Ana
└─ Converte sexta → data real (ex: 2026-05-10)

PASSO 3: Make - Validar/Criar cliente e pet
├─ Busca Ana no Sheets
├─ SE não existe → cria
├─ Busca Rex no Sheets
├─ SE não existe → cria vinculado a Ana
└─ Armazena IDs

PASSO 4: Make - Registrar agendamento
├─ Aba: Agendamentos
├─ Campos:
│  ├─ ID_Agenda: A_001
│  ├─ ID_Cliente: C_002
│  ├─ ID_Pet: P_002
│  ├─ Data: 2026-05-10
│  ├─ Hora: 10:00
│  ├─ Status: confirmado
│  └─ Data_Criacao: 2026-05-07
└─ Salva

PASSO 5: Make - Enviar confirmação ao cliente
├─ Pede Z-API:
│  "Agendamento confirmado!"
│  "Pet: Rex"
│  "Data: Sexta, 10 de maio"
│  "Hora: 10h"
└─ Z-API envia para Ana

PASSO 6: Make - Avisar veterinário
├─ "✅ Agendamento criado"
│  "Cliente: Ana"
│  "Pet: Rex"
│  "Data: Sexta às 10h"
└─ Z-API envia

PASSO 7: Make - Agendar lembrete (opcional)
├─ Cria trigger para amanhã
├─ 1 dia antes do agendamento
└─ Executa fluxo de lembrete

FIM DO FLUXO DE AGENDAMENTO
```

---

### FLUXO 3: LEMBRETE

```
TRIGGER:
Sistema detecta: amanhã tem agendamento

PASSO 1: Make - Buscar agendamentos de amanhã
├─ Aba: Agendamentos
├─ Filtro: Data = amanhã
├─ Status = confirmado
└─ Lista todos

PASSO 2: Make - Para cada agendamento
├─ Busca cliente (ID_Cliente)
├─ Busca pet (ID_Pet)
└─ Pega telefone

PASSO 3: Make - Enviar lembrete
├─ Mensagem:
│  "Olá Ana! 👋"
│  "Lembrando seu agendamento de amanhã!"
│  "Pet: Rex"
│  "Horário: 10h"
│  "Por favor, confirme sua presença."
└─ Z-API envia

FIM DO FLUXO DE LEMBRETE
```

---

## 4. ESTRUTURA DE DADOS

### Banco de Dados (Google Sheets)

#### Aba 1: Veterinários
```
ID_Vet | Nome | Telefone | Email | Status
V_001  | Dr. João | 11987654321 | joao@email.com | ativo
```

#### Aba 2: Clientes
```
ID_Cliente | Nome | Telefone | Email | Data_Criacao
C_001 | João Silva | 11987654321 | joao@email.com | 2026-05-07
C_002 | Ana | 11912345678 | - | 2026-05-07
```

#### Aba 3: Pets
```
ID_Pet | ID_Cliente | Nome | Espécie | Raça | Data_Nascimento
P_001 | C_001 | Rex | Cão | Labrador | 2020-03-15
P_002 | C_002 | Rex | Cão | Poodle | 2022-06-20
```

#### Aba 4: Agendamentos
```
ID_Agenda | ID_Cliente | ID_Pet | Data | Hora | Status | Data_Criacao
A_001 | C_001 | P_001 | 2026-05-10 | 10:00 | confirmado | 2026-05-07
```

#### Aba 5: Cobranças
```
ID_Cobranca | ID_Cliente | Valor | Descrição | Status | ID_Asaas | Link_PIX | Data_Criacao
COB_001 | C_001 | 250.00 | Consulta do Rex | pendente | cob_123456 | https://... | 2026-05-07
```

#### Aba 6: Pagamentos
```
ID_Pagamento | ID_Cobranca | ID_Cliente | Valor_Pago | Data_Pagamento | Status
PAG_001 | COB_001 | C_001 | 250.00 | 2026-05-07 14:35 | confirmado
```

#### Aba 7: Logs
```
ID_Log | Timestamp | Evento | Detalhes | Status
LOG_001 | 2026-05-07 14:30:00 | cobranca_criada | COB_001 criado | sucesso
```

---

## 5. INTEGRAÇÕES E CONEXÕES

### Conexão 1: Z-API ↔ Make

**Webhook de entrada (Make recebe):**
```
Quando: veterinário envia mensagem
URL: https://hook.make.com/vet-assist-incoming
Método: POST
Body:
{
  "from": "5511987654321",
  "message": "Cobrar 250 do João",
  "timestamp": "2026-05-07T14:30:00Z"
}
```

**Webhook de saída (Make envia):**
```
Quando: Make precisa enviar mensagem
Para: Z-API
Ação: POST /send-message
Body:
{
  "to": "5511987654321",
  "message": "Cobrança criada!",
  "type": "text"
}
```

### Conexão 2: Make ↔ Google Sheets

**Leitura:**
```
Módulo: Google Sheets - Search Rows
Aba: Clientes
Busca por: Nome = "João"
Retorna: ID_Cliente, Telefone, Email
```

**Escrita:**
```
Módulo: Google Sheets - Add Row
Aba: Cobranças
Valores: ID_Cobranca, ID_Cliente, Valor, Status...
```

### Conexão 3: Make ↔ Asaas

**Criar cobrança:**
```
Método: POST
URL: https://api.asaas.com/v3/payments
Headers: Authorization: Bearer {token}
Body:
{
  "billingType": "PIX",
  "value": 250.00,
  "customer": "João Silva",
  "description": "Consulta do Rex",
  "dueDate": "2026-05-10"
}
```

**Webhook (Asaas envia):**
```
Quando: pagamento confirmado
URL: https://hook.make.com/vet-assist-payment
Método: POST
Body:
{
  "event": "PAYMENT_RECEIVED",
  "paymentId": "cob_123456",
  "value": 250.00,
  "status": "confirmed"
}
```

---

## 6. SEGURANÇA E VALIDAÇÕES

### Validações Obrigatórias

1. **Validação de Valor**
   - SE valor < 0 → Erro
   - SE valor vazio → Erro
   - SE valor contém vírgula → Converte para ponto

2. **Validação de Cliente**
   - SE cliente não existe → Cria automaticamente
   - SE cliente existe → Usa ID existente
   - SE nome vazio → Erro

3. **Validação de Data**
   - SE data inválida → Erro
   - SE data no passado → Erro
   - SE data não é sexta/segunda/etc → Pergunta

4. **Validação de Telefone**
   - SE telefone vazio → Não envia (avisa)
   - SE telefone inválido → Avisa veterinário

### Tratamento de Erros

```
SE falhar em criar cobrança no Asaas:
├─ Avisa veterinário: "Falha ao gerar PIX"
├─ Log de erro
├─ Retry automático (máx 3 vezes)
└─ SE continuar falhando → Escalação manual

SE falhar ao atualizar Sheets:
├─ Tenta novamente
├─ Log de erro
├─ Notifica veterinário
└─ Guarda dado em fila para depois

SE cliente tiver múltiplos números:
├─ Usa o mais recente
├─ Avisa veterinário qual foi usado
└─ Permite edição manual no Sheets
```

---

## 7. ORDEM DE IMPLEMENTAÇÃO

### Fase 1: Estrutura Base (Dia 1)
- [ ] Google Sheets criado com todas as abas
- [ ] Contas Z-API, Make, Asaas configuradas
- [ ] Documentação de IDs e chaves de acesso

### Fase 2: Fluxo de Cobrança - Parte 1 (Dia 2-3)
- [ ] Make recebe mensagem de Z-API
- [ ] Make extrai valores (valor, cliente)
- [ ] Make busca cliente no Sheets
- [ ] Make cria cliente se não existe
- [ ] Make chama Asaas e cria PIX
- [ ] Make registra no Sheets
- [ ] Make envia confirmação ao cliente

### Fase 3: Fluxo de Cobrança - Parte 2 (Dia 3-4)
- [ ] Asaas envia webhook para Make
- [ ] Make detecta pagamento confirmado
- [ ] Make atualiza status em Cobranças
- [ ] Make cria registro em Pagamentos
- [ ] Make notifica veterinário

### Fase 4: Fluxo de Agendamento (Dia 4-5)
- [ ] Make interpreta agendamento
- [ ] Make cria agendamento no Sheets
- [ ] Make envia confirmação ao cliente
- [ ] Make agenda lembrete automático

### Fase 5: Testes e Validação (Dia 5-6)
- [ ] Testes com 1 cobrança de R$1
- [ ] Testes com agendamentos
- [ ] Testes de erro
- [ ] Testes com veterinário real

---

## 8. RESUMO DA ARQUITETURA

| Componente | Função | Simplicidade |
|---|---|---|
| Z-API | Recebe/Envia WhatsApp | ✅ Muito simples |
| Make | Orquestra fluxos | ✅ Simples com boas práticas |
| Asaas | Cria PIX | ✅ API clara |
| Google Sheets | Armazena dados | ✅ Muito simples |

**Total de integrações: 6**
**Total de fluxos principais: 3**
**Total de webhooks: 2**
**Complexidade geral: BAIXA**

---

**PRÓXIMA ETAPA:**
Criar estrutura detalhada do Google Sheets com exemplo pronto para ser copiado.

