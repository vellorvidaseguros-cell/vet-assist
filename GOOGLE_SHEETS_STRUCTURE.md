# Estrutura Google Sheets - VetAssist MVP

## Visão Geral
5 abas principais conectadas entre si. Tudo feito com IDs para conectar dados automaticamente.

---

## ABA 1: CLIENTES

**Campos Obrigatórios:**
- ID (auto-gerado)
- Nome
- Telefone (com WhatsApp)
- Email (opcional)
- Data Criação

**Exemplo:**
| ID | Nome | Telefone | Email | Data Criação |
|---|---|---|---|---|
| C001 | João Silva | 11987654321 | joao@email.com | 2026-05-01 |
| C002 | Maria Santos | 11912345678 | maria@email.com | 2026-05-02 |

**Conexão com Fluxos:**
- **Agendamento:** Sistema busca cliente por nome → preenche ID
- **Cobrança:** Sistema busca cliente por nome → preenche ID + Telefone
- **Pagamento:** Webhook busca cobrança → identifica cliente

---

## ABA 2: PETS

**Campos Obrigatórios:**
- ID_Pet (auto-gerado)
- ID_Cliente (referência a CLIENTES)
- Nome_Pet
- Espécie (cão, gato, etc)
- Raça (opcional)
- Data_Nascimento (opcional)

**Exemplo:**
| ID_Pet | ID_Cliente | Nome_Pet | Espécie | Raça | Data_Nascimento |
|---|---|---|---|---|---|
| P001 | C001 | Rex | Cão | Labrador | 2020-03-15 |
| P002 | C001 | Miau | Gato | Persa | 2022-06-20 |
| P003 | C002 | Bilu | Cão | Poodle | 2019-11-10 |

**Conexão com Fluxos:**
- **Agendamento:** Sistema busca pets do cliente para confirmar
- **Histórico:** Rastreia qual pet foi atendido

---

## ABA 3: AGENDAMENTOS

**Campos Obrigatórios:**
- ID_Agenda (auto-gerado)
- ID_Cliente (referência a CLIENTES)
- ID_Pet (referência a PETS)
- Data
- Hora
- Status (pendente/confirmado/cancelado/realizado)
- Data_Criação
- Data_Confirmação (quando cliente confirmar)

**Exemplo:**
| ID_Agenda | ID_Cliente | ID_Pet | Data | Hora | Status | Data_Criação | Data_Confirmação |
|---|---|---|---|---|---|---|---|
| A001 | C001 | P001 | 2026-05-10 | 14:00 | confirmado | 2026-05-07 | 2026-05-07 |
| A002 | C002 | P003 | 2026-05-12 | 10:30 | pendente | 2026-05-07 | - |

**Conexão com Fluxos:**
- **Agendamento:** Sistema cria linha aqui automaticamente
- **Cobrança:** Pode linkar a um agendamento
- **Lembrete:** Sistema busca agendamentos de 24h antes

---

## ABA 4: COBRANÇAS

**Campos Obrigatórios:**
- ID_Cobranca (auto-gerado)
- ID_Cliente (referência a CLIENTES)
- ID_Agenda (opcional - pode estar ou não ligado a agendamento)
- Valor
- Descrição (ex: "Consulta", "Vacinação")
- Data_Criacao
- ID_Asaas (ID da cobrança no Asaas)
- Link_Pix (gerado pela Asaas)
- Status (pendente/pago/expirado)
- Data_Envio_Cliente (quando link foi enviado)

**Exemplo:**
| ID_Cobranca | ID_Cliente | ID_Agenda | Valor | Descrição | Data_Criacao | ID_Asaas | Link_Pix | Status | Data_Envio_Cliente |
|---|---|---|---|---|---|---|---|---|---|
| CB001 | C001 | A001 | 250 | Consulta | 2026-05-07 | asaas_123456 | https://pix.asaas.com/... | pendente | 2026-05-07 |
| CB002 | C002 | - | 150 | Banho | 2026-05-06 | asaas_789012 | https://pix.asaas.com/... | pago | 2026-05-06 |

**Conexão com Fluxos:**
- **Cobrança:** Sistema cria linha + gera ID_Asaas automaticamente
- **Pagamento:** Webhook atualiza Status para "pago"

---

## ABA 5: PAGAMENTOS

**Campos Obrigatórios:**
- ID_Pagamento (auto-gerado)
- ID_Cobranca (referência a COBRANÇAS)
- ID_Cliente (referência a CLIENTES)
- Valor_Pago
- Data_Pagamento
- Método (PIX/Outros)
- Status_Confirmacao (confirmado/pendente)

**Exemplo:**
| ID_Pagamento | ID_Cobranca | ID_Cliente | Valor_Pago | Data_Pagamento | Método | Status_Confirmacao |
|---|---|---|---|---|---|---|
| P001 | CB002 | C002 | 150 | 2026-05-06 14:32 | PIX | confirmado |
| P002 | CB001 | C001 | 250 | 2026-05-08 09:15 | PIX | confirmado |

**Conexão com Fluxos:**
- **Pagamento:** Webhook do Asaas cria linha aqui automaticamente
- **Notificação:** Sistema avisa quando pagamento chegar

---

## Fluxo de Conexão de Dados

```
CLIENTES (C001, C002...)
    ├→ PETS (P001, P002... com ID_Cliente)
    ├→ AGENDAMENTOS (A001, A002... com ID_Cliente + ID_Pet)
    └→ COBRANÇAS (CB001, CB002... com ID_Cliente + ID_Agenda)
        └→ PAGAMENTOS (P001, P002... com ID_Cobranca)
```

**Exemplo Completo:**
1. João (C001) envia: "Agendar Rex para quinta às 14h"
2. Sistema cria linha em AGENDAMENTOS: A001 (C001, P001, 2026-05-10, 14:00)
3. Mais tarde: "Cobrar 250 do João"
4. Sistema cria linha em COBRANÇAS: CB001 (C001, A001, 250)
5. Sistema gera PIX na Asaas e envia para 11987654321
6. Cliente paga PIX
7. Webhook do Asaas cria linha em PAGAMENTOS: P001 (CB001, C001, 250)
8. Sistema avisa: "João pagou 250!"

---

## Setup do Google Sheets

1. Criar planilha nova
2. Renomear abas: Clientes, Pets, Agendamentos, Cobranças, Pagamentos
3. Adicionar headers em cada aba
4. **Não adicione dados ainda** — sistema vai popular automaticamente
5. Compartilhar acesso com conta de automação (Make/Zapier)

