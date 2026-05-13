# VetAssist - Requisitos do Projeto

## Visão Geral do MVP

**Objetivo:**
Criar uma secretária digital via WhatsApp para médicos veterinários, com automação parcial desde o início.

**Escopo:**
- MVP funcional em poucos dias
- Não é um app completo
- Sem arquitetura complexa
- Automação apenas do essencial
- Resto operado manualmente pelo proprietário

---

## Fluxos Principais

### 1. Agendamento
- Veterinário envia mensagem via WhatsApp
- Sistema registra (ou avisa o proprietário)
- Confirmação enviada ao cliente (manual ou automática)
- Lembrete pode ser automático simples ou manual

### 2. Cobrança ⭐ (PRIORIDADE MÁXIMA)
- Veterinário envia: "Cobrar 250 do João"
- Sistema gera cobrança PIX **automaticamente** (Asaas ou similar)
- Sistema envia o link automaticamente ao cliente
- Sistema avisa quando o pagamento acontecer

### 3. Registro
- Tudo deve ser salvo em Google Sheets ou Airtable

---

## Stack Tecnológico
- WhatsApp API
- Make (ou similar para automação)
- Asaas (para pagamentos PIX)
- Google Sheets (para registro de dados)

---

## Fluxo de Cobrança Detalhado ⭐

**Cenário:**
Veterinário envia via WhatsApp: `"Cobrar 250 do João"`

**Passos Automatizados:**

1. **Identificar valor e cliente**
   - Sistema extrai o valor (250)
   - Sistema identifica o cliente (João)

2. **Gerar cobrança PIX automaticamente**
   - Criar cobrança na Asaas com os dados
   - Gerar link de pagamento PIX

3. **Enviar mensagem ao cliente**
   - Sistema envia mensagem WhatsApp automática
   - Inclui link de pagamento PIX

4. **Registrar na planilha**
   - Salvar dados da cobrança em Google Sheets ou Airtable
   - Status: pendente/pago

5. **Avisar quando pagamento for feito**
   - Sistema detecta pagamento (webhook Asaas)
   - Avisa veterinário/proprietário via mensagem
   - Atualiza status na planilha

---

## Fluxo de Agendamento (Modelo Híbrido)

**Entrada:**
Veterinário envia via WhatsApp: `"Agendar João para quinta às 14h"`

**Passos:**

1. **Veterinário envia mensagem**
   - Sistema recebe via WhatsApp

2. **Sistema registra OU avisa para validar**
   - Opção A: Registra automaticamente e avisa você
   - Opção B: Envia para você validar antes de confirmar

3. **Você pode ajustar manualmente se necessário**
   - Acesso a painel simples
   - Editar data/hora
   - Editar dados do cliente
   - Aprova ou rejeita

4. **Cliente recebe confirmação**
   - Mensagem WhatsApp automática com data/hora
   - Formato: "Seu agendamento confirmado para [data] às [hora]"

5. **Lembrete**
   - Automático simples: envia 24h antes
   - Ou: você envia manual quando quiser

6. **Registrar na planilha**
   - Salvar em Google Sheets ou Airtable
   - Campos: cliente, data, hora, status

---

## Estrutura Google Sheets

Veja arquivo completo em: `GOOGLE_SHEETS_STRUCTURE.md`

**5 Abas:**
1. **Clientes** - Base de clientes com telefone/email
2. **Pets** - Pets vinculados aos clientes
3. **Agendamentos** - Agendamentos do veterinário
4. **Cobranças** - Cobranças geradas (com IDs do Asaas)
5. **Pagamentos** - Registro de pagamentos confirmados

Tudo conectado via IDs para automação perfeita.

---

## Testes e Validação

Veja checklist completo em: `TESTING_CHECKLIST.md`

**O que será testado:**
1. ✅ Cobrança funcionando automaticamente
2. ✅ Agendamento funcionando
3. ✅ Registro correto na planilha
4. ✅ Confirmação enviada ao cliente
5. ✅ Tempo e performance
6. ✅ Tratamento de erros

Com 1 veterinário real antes de escalar.

---

## Arquitetura Completa

Veja documento detalhado em: `ARQUITETURA_MVP.md`

**Contém:**
- ✅ Fluxo de dados visual (diagrama)
- ✅ Detalhamento de cada componente
- ✅ 3 fluxos principais com passo a passo
- ✅ Estrutura de dados (Google Sheets)
- ✅ Integrações e conexões
- ✅ Validações e tratamento de erros
- ✅ Ordem de implementação (5 fases)

---

## Status do Projeto

**Documentação Completa:**
- ✅ PROJECT_REQUIREMENTS.md - Requisitos principais
- ✅ GOOGLE_SHEETS_STRUCTURE.md - Estrutura do banco
- ✅ TESTING_CHECKLIST.md - Checklist de testes
- ✅ ARQUITETURA_MVP.md - Arquitetura técnica

**Próximas Etapas:**
- [ ] Google Sheets criado e testado
- [ ] Configurar Z-API, Make, Asaas
- [ ] Implementar fluxos no Make
- [ ] Testar com veterinário real
