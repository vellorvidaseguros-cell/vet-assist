# Checklist de Testes - VetAssist MVP

**Data do Teste:** ________________  
**Veterinário Testador:** ________________  
**Telefone do Cliente Teste:** ________________  

---

## TESTE 1: COBRANÇA AUTOMÁTICA ⭐

### Preparação
- [ ] Cliente teste cadastrado na aba "Clientes" com telefone WhatsApp
- [ ] Asaas conectado e testado
- [ ] Make/Zapier configurado com webhook Asaas

### Execução
- [ ] Veterinário envia: `"Cobrar 150 do [Nome Cliente]"`
- [ ] Sistema identifica corretamente o valor (150)
- [ ] Sistema identifica corretamente o cliente
- [ ] Cobrança criada na aba "Cobranças" com:
  - [ ] ID_Cobranca preenchido
  - [ ] ID_Cliente correto
  - [ ] Valor correto (150)
  - [ ] Status = "pendente"
  - [ ] Link_Pix gerado

### Validação Cliente
- [ ] Cliente recebe mensagem WhatsApp com link PIX
- [ ] Link PIX está funcionando (pode ser copiado)
- [ ] Mensagem contém: valor, descrição básica

### Validação Pagamento
- [ ] Cliente clica no PIX e realiza pagamento
- [ ] Status na aba "Cobranças" muda para "pago" automaticamente
- [ ] Linha criada na aba "Pagamentos" com:
  - [ ] ID_Pagamento
  - [ ] ID_Cobranca vinculado
  - [ ] Valor_Pago correto
  - [ ] Data_Pagamento preenchida
  - [ ] Status_Confirmacao = "confirmado"
- [ ] Veterinário recebe notificação: "Pagamento de 150 confirmado"

---

## TESTE 2: AGENDAMENTO

### Preparação
- [ ] Cliente teste cadastrado em "Clientes"
- [ ] Pet teste cadastrado em "Pets" vinculado ao cliente
- [ ] Make/Zapier configurado para agendamentos

### Execução
- [ ] Veterinário envia: `"Agendar [Nome Cliente] para [Data] às [Hora]"`
  - Exemplo: `"Agendar João para 15/05 às 14h"`
- [ ] Sistema identifica corretamente:
  - [ ] Nome do cliente
  - [ ] Data
  - [ ] Hora

### Validação na Planilha
- [ ] Linha criada na aba "Agendamentos" com:
  - [ ] ID_Agenda preenchido
  - [ ] ID_Cliente correto
  - [ ] ID_Pet correto (ou identificado)
  - [ ] Data preenchida
  - [ ] Hora preenchida
  - [ ] Status = "pendente" ou "confirmado"

### Validação com Cliente
- [ ] Cliente recebe mensagem WhatsApp com confirmação:
  - [ ] Contém: nome do cliente, data, hora
  - [ ] Mensagem é clara e legível
- [ ] Mensagem enviada dentro de 30 segundos da solicitação

---

## TESTE 3: REGISTRO NA PLANILHA

### Validação Completa de Dados

**Aba Clientes:**
- [ ] Cliente aparece com ID gerado
- [ ] Telefone preenchido corretamente
- [ ] Sem dados vazios obrigatórios

**Aba Pets:**
- [ ] Pet vinculado corretamente ao cliente (ID_Cliente)
- [ ] Nome, espécie preenchidos
- [ ] Sem duplicatas

**Aba Agendamentos:**
- [ ] Agendamento vinculado corretamente (ID_Cliente + ID_Pet)
- [ ] Data e hora corretas
- [ ] Status atualizado corretamente

**Aba Cobranças:**
- [ ] Cobrança vinculada ao cliente correto
- [ ] Vinculada ao agendamento (se aplicável)
- [ ] Valor correto
- [ ] ID_Asaas preenchido
- [ ] Link_Pix funcional

**Aba Pagamentos:**
- [ ] Pagamento vinculado corretamente à cobrança
- [ ] Valor_Pago corresponde ao valor da cobrança
- [ ] Data e hora registradas
- [ ] Status atualizado

---

## TESTE 4: CONFIRMAÇÃO PARA CLIENTE

### Mensagem de Agendamento
- [ ] Recebido dentro de 30 segundos
- [ ] Contém: data, hora, nome do cliente
- [ ] Formato legível
- [ ] Sem erros de digitação

### Mensagem de Cobrança (PIX)
- [ ] Recebido dentro de 30 segundos após solicitação
- [ ] Contém: valor, descrição (opcional), link PIX
- [ ] Link PIX é clicável
- [ ] Sem erros de formatação

### Mensagem de Confirmação de Pagamento
- [ ] Recebido dentro de 5 minutos após pagamento
- [ ] Contém: valor pago, data/hora, confirmação
- [ ] Mensagem é clara

---

## TESTE 5: TEMPO E PERFORMANCE

- [ ] Cobrança gerada em menos de 30 segundos
- [ ] Agendamento registrado em menos de 30 segundos
- [ ] Mensagens enviadas ao cliente em menos de 30 segundos
- [ ] Pagamento detectado em menos de 5 minutos
- [ ] Planilha atualiza em tempo real (máximo 1 minuto)

---

## TESTE 6: CASOS DE ERRO

- [ ] Se cliente não existe: sistema avisa veterinário
- [ ] Se valor inválido: sistema solicita correção
- [ ] Se data inválida: sistema solicita correção
- [ ] Se link PIX expirar: sistema permite gerar novo

---

## RESULTADO FINAL

**Status Geral:**
- [ ] PASSOU - MVP está pronto para uso
- [ ] PASSOU COM RESSALVAS - Pequenos ajustes necessários
- [ ] FALHOU - Volta para desenvolvimento

**Ressalvas (se aplicável):**
```
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
```

**Próximos Passos:**
```
_________________________________________________________________
_________________________________________________________________
```

**Data de Conclusão:** ________________

