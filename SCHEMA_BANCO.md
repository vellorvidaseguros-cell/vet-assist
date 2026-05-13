# SCHEMA DO BANCO DE DADOS - VetAssist

**Banco:** PostgreSQL  
**ORM:** Sequelize ou TypeORM  

---

## TABELAS PRINCIPAIS

### 1. Veterinários (users)

Armazena informações do usuário/veterinário.

```sql
CREATE TABLE veterinarios (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  nome VARCHAR(255) NOT NULL,
  telefone VARCHAR(20),
  cpf VARCHAR(11),
  crmv VARCHAR(20),
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Campos:**
- `id` - ID único (auto-gerado)
- `email` - Email único (login)
- `password_hash` - Senha criptografada (bcrypt)
- `nome` - Nome completo
- `telefone` - Telefone para contato
- `cpf` - CPF (opcional, para depois)
- `crmv` - Registro CRMV (opcional, para depois)
- `data_criacao` - Quando criou a conta
- `data_atualizacao` - Última atualização

**Índices:**
```sql
CREATE INDEX idx_veterinarios_email ON veterinarios(email);
```

---

### 2. Clientes

Armazena clientes dos veterinários.

```sql
CREATE TABLE clientes (
  id SERIAL PRIMARY KEY,
  id_veterinario INT NOT NULL REFERENCES veterinarios(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  telefone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  endereco VARCHAR(500),
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_ultima_consulta TIMESTAMP,
  data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Campos:**
- `id` - ID único
- `id_veterinario` - Referência ao veterinário (isolamento de dados)
- `nome` - Nome do cliente
- `telefone` - Telefone (obrigatório para WhatsApp depois)
- `email` - Email (opcional)
- `endereco` - Endereço (opcional)
- `data_criacao` - Quando foi cadastrado
- `data_ultima_consulta` - Quando foi a última consulta (auto-atualiza)
- `data_atualizacao` - Última atualização

**Índices:**
```sql
CREATE INDEX idx_clientes_id_veterinario ON clientes(id_veterinario);
CREATE INDEX idx_clientes_nome ON clientes(nome);
```

**Nota:** `id_veterinario` garante que cada veterinário vê APENAS seus clientes.

---

### 3. Pets

Armazena pets dos clientes.

```sql
CREATE TABLE pets (
  id SERIAL PRIMARY KEY,
  id_cliente INT NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  id_veterinario INT NOT NULL REFERENCES veterinarios(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  especie VARCHAR(50) NOT NULL,
  raca VARCHAR(100),
  data_nascimento DATE,
  peso DECIMAL(10,2),
  genero VARCHAR(10),
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Campos:**
- `id` - ID único
- `id_cliente` - Referência ao cliente
- `id_veterinario` - Referência ao veterinário (para queries rápidas)
- `nome` - Nome do pet
- `especie` - Cão, gato, coelho, etc
- `raca` - Raça
- `data_nascimento` - Data de nascimento
- `peso` - Peso atual
- `genero` - Macho/Fêmea
- `data_criacao` - Quando foi cadastrado
- `data_atualizacao` - Última atualização

**Índices:**
```sql
CREATE INDEX idx_pets_id_cliente ON pets(id_cliente);
CREATE INDEX idx_pets_id_veterinario ON pets(id_veterinario);
```

---

### 4. Agendamentos

Armazena agendamentos (core do app).

```sql
CREATE TABLE agendamentos (
  id SERIAL PRIMARY KEY,
  id_veterinario INT NOT NULL REFERENCES veterinarios(id) ON DELETE CASCADE,
  id_cliente INT NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  id_pet INT NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  data_agendamento DATE NOT NULL,
  hora_agendamento TIME NOT NULL,
  tipo_atendimento VARCHAR(100),
  descricao TEXT,
  status VARCHAR(50) DEFAULT 'pendente',
  observacoes TEXT,
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Campos:**
- `id` - ID único
- `id_veterinario` - Referência ao veterinário
- `id_cliente` - Referência ao cliente
- `id_pet` - Referência ao pet
- `data_agendamento` - Data (YYYY-MM-DD)
- `hora_agendamento` - Hora (HH:MM:SS)
- `tipo_atendimento` - Consulta, Vacinação, Banho, Cirurgia, etc
- `descricao` - Descrição do atendimento
- `status` - pendente, confirmado, realizado, cancelado
- `observacoes` - Anotações do veterinário
- `data_criacao` - Quando foi criado
- `data_atualizacao` - Última atualização

**Índices:**
```sql
CREATE INDEX idx_agendamentos_id_veterinario ON agendamentos(id_veterinario);
CREATE INDEX idx_agendamentos_data ON agendamentos(data_agendamento);
CREATE INDEX idx_agendamentos_status ON agendamentos(status);
```

**Status válidos:**
- `pendente` - Agendado mas não confirmado
- `confirmado` - Confirmado com cliente
- `realizado` - Atendimento foi feito
- `cancelado` - Foi cancelado

---

### 5. Cobranças (Para futuro, deixa pronto)

Armazena cobranças/faturas.

```sql
CREATE TABLE cobrancas (
  id SERIAL PRIMARY KEY,
  id_veterinario INT NOT NULL REFERENCES veterinarios(id) ON DELETE CASCADE,
  id_cliente INT NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  id_agendamento INT REFERENCES agendamentos(id),
  valor DECIMAL(10,2) NOT NULL,
  descricao VARCHAR(500),
  status VARCHAR(50) DEFAULT 'pendente',
  id_asaas VARCHAR(255),
  link_pix VARCHAR(500),
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_vencimento DATE,
  data_pagamento TIMESTAMP,
  data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Status válidos:**
- `pendente` - Aguardando pagamento
- `pago` - Pagamento confirmado
- `cancelado` - Fatura cancelada
- `expirado` - Vencimento passou

---

### 6. Subscriptions (Para futuro com Stripe)

Armazena informações de assinatura.

```sql
CREATE TABLE subscriptions (
  id SERIAL PRIMARY KEY,
  id_veterinario INT NOT NULL UNIQUE REFERENCES veterinarios(id) ON DELETE CASCADE,
  plano VARCHAR(50) DEFAULT 'basico',
  status VARCHAR(50) DEFAULT 'ativo',
  data_inicio DATE NOT NULL,
  data_renovacao DATE NOT NULL,
  valor_mensal DECIMAL(10,2),
  id_stripe VARCHAR(255),
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Status válidos:**
- `ativo` - Assinatura está válida
- `cancelado` - Cancelada pelo usuário
- `expirado` - Vencimento passou
- `aguardando_pagamento` - Pagamento pendente

---

## RELAÇÕES ENTRE TABELAS

```
┌─────────────────┐
│ Veterinários    │ (user)
│ (id)            │
└────────┬────────┘
         │ (1:N)
         ├──────────────┬──────────────┬──────────────┐
         │              │              │              │
    ┌────▼─────┐  ┌────▼──────┐ ┌────▼─────┐  ┌─────▼────┐
    │ Clientes  │  │ Pets      │ │Agendamentos│Cobranças
    │ (id)      │  │ (id)      │ │ (id)      │ │ (id)
    └────┬─────┘  └────┬──────┘ └────┬─────┘  └──────────┘
         │ (1:N)       │ (1:N)        │ (N:1)
         └──────┬──────┘             │
                │                    │
            Pets referencia      Agendamentos referencia
            Clientes            Clientes + Pets
```

---

## ISOLAMENTO DE DADOS (Multi-tenant)

**IMPORTANTE:** Cada veterinário só vê seus próprios dados.

**Exemplo de query segura:**
```sql
-- Buscar clientes do veterinário logado
SELECT * FROM clientes 
WHERE id_veterinario = 123;

-- Isso garante que veterinário X não vê clientes do veterinário Y
```

**No Backend (Node.js):**
```javascript
// Middleware que valida acesso
async function verificarAcesso(req, res, next) {
  const idVeterinario = req.user.id; // Vem do JWT
  const idCliente = req.params.id;
  
  // Verifica se o cliente pertence a este veterinário
  const cliente = await Cliente.findOne({
    where: { id: idCliente, id_veterinario: idVeterinario }
  });
  
  if (!cliente) {
    return res.status(403).json({ erro: "Acesso negado" });
  }
  
  next();
}
```

---

## DADOS INICIAIS (Seeds)

Quando criar a conta, inserir:

```sql
-- Tipos de atendimento padrão (pode estar em tabela separada depois)
INSERT INTO tipos_atendimento (nome) VALUES
('Consulta'),
('Vacinação'),
('Banho'),
('Tosa'),
('Cirurgia'),
('Exame'),
('Limpeza de dentes'),
('Outros');
```

---

## BACKUP E RECOVERY

**Para depois:** Script de backup automático

```bash
# Backup diário
pg_dump -U user vet_assist > backup_$(date +%Y%m%d).sql

# Restaurar
psql -U user vet_assist < backup_20260507.sql
```

---

## MIGRATIONS (Versionamento do Banco)

Usar Sequelize migrations para versionamento:

```
migrations/
├── 20260507_01_create_veterinarios.js
├── 20260507_02_create_clientes.js
├── 20260507_03_create_pets.js
├── 20260507_04_create_agendamentos.js
└── 20260507_05_create_cobrancas.js
```

**Executar:**
```bash
npx sequelize-cli db:migrate
```

---

## RESUMO DO SCHEMA

| Tabela | Linhas | Propósito |
|---|---|---|
| veterinarios | 1 por usuário | Usuários do app |
| clientes | N | Clientes de cada veterinário |
| pets | N | Pets de cada cliente |
| agendamentos | N | Agendamentos |
| cobrancas | N | Cobranças (futuro) |
| subscriptions | 1 por usuário | Assinatura (futuro) |

**Total de tabelas:** 6  
**Total de índices:** ~10  
**Complexidade:** BAIXA

