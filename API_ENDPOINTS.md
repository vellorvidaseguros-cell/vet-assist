# API ENDPOINTS - VetAssist Backend

**Base URL:** `https://api.vetassist.com/v1`  
**Autenticação:** JWT Token no header `Authorization: Bearer {token}`

---

## 1. AUTENTICAÇÃO

### 1.1 Cadastro de Veterinário

```
POST /auth/signup
Content-Type: application/json

{
  "email": "veterinario@example.com",
  "senha": "SenhaSegura123!",
  "nome": "Dr. João Silva",
  "telefone": "11987654321"
}

Response 201:
{
  "id": 1,
  "email": "veterinario@example.com",
  "nome": "Dr. João Silva",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "mensagem": "Cadastro realizado com sucesso"
}

Response 400:
{
  "erro": "Email já cadastrado"
}
```

---

### 1.2 Login

```
POST /auth/login
Content-Type: application/json

{
  "email": "veterinario@example.com",
  "senha": "SenhaSegura123!"
}

Response 200:
{
  "id": 1,
  "email": "veterinario@example.com",
  "nome": "Dr. João Silva",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "mensagem": "Login realizado com sucesso"
}

Response 401:
{
  "erro": "Email ou senha incorretos"
}
```

---

### 1.3 Recuperar Senha

```
POST /auth/recuperar-senha
Content-Type: application/json

{
  "email": "veterinario@example.com"
}

Response 200:
{
  "mensagem": "Email de recuperação enviado"
}
```

---

### 1.4 Reset Senha (com token)

```
POST /auth/reset-senha/:token
Content-Type: application/json

{
  "nova_senha": "NovaSenha123!"
}

Response 200:
{
  "mensagem": "Senha alterada com sucesso"
}
```

---

## 2. CLIENTES

### 2.1 Listar Clientes

```
GET /clientes
Headers: Authorization: Bearer {token}

Response 200:
{
  "total": 3,
  "clientes": [
    {
      "id": 1,
      "nome": "João Silva",
      "telefone": "11987654321",
      "email": "joao@example.com",
      "endereco": "Rua A, 123",
      "data_ultima_consulta": "2026-05-01",
      "data_criacao": "2026-04-15"
    },
    {
      "id": 2,
      "nome": "Maria Santos",
      "telefone": "11912345678",
      "email": null,
      "endereco": null,
      "data_ultima_consulta": null,
      "data_criacao": "2026-05-05"
    }
  ]
}
```

---

### 2.2 Buscar Cliente por Nome

```
GET /clientes?nome=João
Headers: Authorization: Bearer {token}

Response 200:
{
  "total": 1,
  "clientes": [
    {
      "id": 1,
      "nome": "João Silva",
      "telefone": "11987654321",
      ...
    }
  ]
}
```

---

### 2.3 Ver Cliente

```
GET /clientes/:id
Headers: Authorization: Bearer {token}

Response 200:
{
  "id": 1,
  "nome": "João Silva",
  "telefone": "11987654321",
  "email": "joao@example.com",
  "endereco": "Rua A, 123",
  "data_ultima_consulta": "2026-05-01",
  "data_criacao": "2026-04-15",
  "pets": [
    {
      "id": 1,
      "nome": "Rex",
      "especie": "Cão",
      "raca": "Labrador"
    }
  ]
}

Response 403:
{
  "erro": "Acesso negado"
}

Response 404:
{
  "erro": "Cliente não encontrado"
}
```

---

### 2.4 Criar Cliente

```
POST /clientes
Headers: Authorization: Bearer {token}
Content-Type: application/json

{
  "nome": "Ana Costa",
  "telefone": "11999999999",
  "email": "ana@example.com",
  "endereco": "Rua B, 456"
}

Response 201:
{
  "id": 3,
  "nome": "Ana Costa",
  "telefone": "11999999999",
  "email": "ana@example.com",
  "endereco": "Rua B, 456",
  "data_criacao": "2026-05-07",
  "mensagem": "Cliente criado com sucesso"
}

Response 400:
{
  "erro": "Nome e telefone são obrigatórios"
}
```

---

### 2.5 Editar Cliente

```
PUT /clientes/:id
Headers: Authorization: Bearer {token}
Content-Type: application/json

{
  "nome": "Ana Costa Silva",
  "telefone": "11999999999",
  "email": "ana.silva@example.com",
  "endereco": "Rua B, 789"
}

Response 200:
{
  "id": 3,
  "nome": "Ana Costa Silva",
  "telefone": "11999999999",
  "email": "ana.silva@example.com",
  "endereco": "Rua B, 789",
  "data_atualizacao": "2026-05-07",
  "mensagem": "Cliente atualizado com sucesso"
}

Response 403:
{
  "erro": "Acesso negado"
}

Response 404:
{
  "erro": "Cliente não encontrado"
}
```

---

### 2.6 Deletar Cliente

```
DELETE /clientes/:id
Headers: Authorization: Bearer {token}

Response 200:
{
  "mensagem": "Cliente deletado com sucesso"
}

Response 403:
{
  "erro": "Acesso negado"
}

Response 404:
{
  "erro": "Cliente não encontrado"
}
```

---

## 3. PETS

### 3.1 Listar Pets de um Cliente

```
GET /clientes/:id_cliente/pets
Headers: Authorization: Bearer {token}

Response 200:
{
  "total": 2,
  "pets": [
    {
      "id": 1,
      "nome": "Rex",
      "especie": "Cão",
      "raca": "Labrador",
      "data_nascimento": "2020-03-15",
      "peso": 32.5,
      "genero": "Macho",
      "data_criacao": "2026-04-15"
    },
    {
      "id": 2,
      "nome": "Miau",
      "especie": "Gato",
      "raca": "Persa",
      "data_nascimento": "2022-06-20",
      "peso": 4.2,
      "genero": "Fêmea",
      "data_criacao": "2026-04-20"
    }
  ]
}
```

---

### 3.2 Ver Pet

```
GET /pets/:id
Headers: Authorization: Bearer {token}

Response 200:
{
  "id": 1,
  "nome": "Rex",
  "especie": "Cão",
  "raca": "Labrador",
  "data_nascimento": "2020-03-15",
  "peso": 32.5,
  "genero": "Macho",
  "cliente": {
    "id": 1,
    "nome": "João Silva"
  },
  "agendamentos_recentes": [
    {
      "id": 1,
      "data": "2026-05-07",
      "hora": "14:00",
      "tipo": "Consulta",
      "status": "confirmado"
    }
  ]
}
```

---

### 3.3 Criar Pet

```
POST /clientes/:id_cliente/pets
Headers: Authorization: Bearer {token}
Content-Type: application/json

{
  "nome": "Bilu",
  "especie": "Cão",
  "raca": "Poodle",
  "data_nascimento": "2022-08-10",
  "peso": 8.0,
  "genero": "Macho"
}

Response 201:
{
  "id": 3,
  "nome": "Bilu",
  "especie": "Cão",
  "raca": "Poodle",
  "data_nascimento": "2022-08-10",
  "peso": 8.0,
  "genero": "Macho",
  "data_criacao": "2026-05-07",
  "mensagem": "Pet criado com sucesso"
}

Response 400:
{
  "erro": "Nome, espécie e cliente são obrigatórios"
}
```

---

### 3.4 Editar Pet

```
PUT /pets/:id
Headers: Authorization: Bearer {token}
Content-Type: application/json

{
  "peso": 8.5
}

Response 200:
{
  "id": 3,
  "nome": "Bilu",
  "peso": 8.5,
  "data_atualizacao": "2026-05-07",
  "mensagem": "Pet atualizado com sucesso"
}
```

---

### 3.5 Deletar Pet

```
DELETE /pets/:id
Headers: Authorization: Bearer {token}

Response 200:
{
  "mensagem": "Pet deletado com sucesso"
}
```

---

## 4. AGENDAMENTOS

### 4.1 Listar Agendamentos (com filtros)

```
GET /agendamentos?data=2026-05-07&status=confirmado
Headers: Authorization: Bearer {token}

Query params:
- data: YYYY-MM-DD (opcional, filtra por dia)
- data_inicio: YYYY-MM-DD (opcional)
- data_fim: YYYY-MM-DD (opcional)
- status: confirmado/pendente/realizado/cancelado (opcional)
- limite: número (opcional, máximo 100)

Response 200:
{
  "total": 3,
  "agendamentos": [
    {
      "id": 1,
      "cliente": {
        "id": 1,
        "nome": "João Silva"
      },
      "pet": {
        "id": 1,
        "nome": "Rex"
      },
      "data": "2026-05-07",
      "hora": "09:00",
      "tipo_atendimento": "Consulta",
      "descricao": "Verificar vacinação",
      "status": "confirmado",
      "data_criacao": "2026-05-05"
    }
  ]
}
```

---

### 4.2 Listar Agendamentos de Hoje

```
GET /agendamentos/hoje
Headers: Authorization: Bearer {token}

Response 200:
{
  "total": 3,
  "data_hoje": "2026-05-07",
  "agendamentos": [
    {
      "id": 1,
      "hora": "09:00",
      "cliente": "João Silva",
      "pet": "Rex",
      "tipo": "Consulta",
      "status": "confirmado"
    },
    {
      "id": 2,
      "hora": "10:30",
      "cliente": "Maria Santos",
      "pet": "Bilu",
      "tipo": "Vacinação",
      "status": "pendente"
    }
  ]
}
```

---

### 4.3 Ver Agendamento

```
GET /agendamentos/:id
Headers: Authorization: Bearer {token}

Response 200:
{
  "id": 1,
  "cliente": {
    "id": 1,
    "nome": "João Silva",
    "telefone": "11987654321"
  },
  "pet": {
    "id": 1,
    "nome": "Rex",
    "especie": "Cão"
  },
  "data": "2026-05-07",
  "hora": "09:00",
  "tipo_atendimento": "Consulta",
  "descricao": "Verificar vacinação",
  "observacoes": "Pet muito agitado",
  "status": "confirmado",
  "data_criacao": "2026-05-05",
  "data_atualizacao": "2026-05-06"
}
```

---

### 4.4 Criar Agendamento

```
POST /agendamentos
Headers: Authorization: Bearer {token}
Content-Type: application/json

{
  "id_cliente": 1,
  "id_pet": 1,
  "data": "2026-05-10",
  "hora": "14:00",
  "tipo_atendimento": "Consulta",
  "descricao": "Verificar vacinação",
  "status": "pendente"
}

Response 201:
{
  "id": 3,
  "id_cliente": 1,
  "id_pet": 1,
  "data": "2026-05-10",
  "hora": "14:00",
  "tipo_atendimento": "Consulta",
  "status": "pendente",
  "data_criacao": "2026-05-07",
  "mensagem": "Agendamento criado com sucesso"
}

Response 400:
{
  "erro": "Cliente, pet, data e hora são obrigatórios"
}

Response 409:
{
  "erro": "Horário já ocupado"
}
```

---

### 4.5 Editar Agendamento

```
PUT /agendamentos/:id
Headers: Authorization: Bearer {token}
Content-Type: application/json

{
  "data": "2026-05-11",
  "hora": "15:00",
  "status": "confirmado",
  "observacoes": "Remédio prescrito"
}

Response 200:
{
  "id": 3,
  "data": "2026-05-11",
  "hora": "15:00",
  "status": "confirmado",
  "observacoes": "Remédio prescrito",
  "data_atualizacao": "2026-05-07",
  "mensagem": "Agendamento atualizado com sucesso"
}
```

---

### 4.6 Marcar Agendamento como Realizado

```
PUT /agendamentos/:id/realizado
Headers: Authorization: Bearer {token}
Content-Type: application/json

{
  "observacoes": "Consulta realizada sem intercorrências"
}

Response 200:
{
  "id": 3,
  "status": "realizado",
  "data_atualizacao": "2026-05-07",
  "mensagem": "Agendamento marcado como realizado"
}
```

---

### 4.7 Cancelar Agendamento

```
DELETE /agendamentos/:id
Headers: Authorization: Bearer {token}

Response 200:
{
  "mensagem": "Agendamento cancelado com sucesso"
}
```

---

## 5. DASHBOARD (Estatísticas)

### 5.1 Resumo do Dashboard

```
GET /dashboard/resumo
Headers: Authorization: Bearer {token}

Response 200:
{
  "total_agendamentos_mes": 45,
  "total_clientes": 12,
  "total_pets": 18,
  "agendamentos_realizados": 38,
  "agendamentos_cancelados": 3,
  "taxa_conclusao": 84.4,
  "proximos_agendamentos": [
    {
      "id": 1,
      "hora": "09:00",
      "cliente": "João Silva",
      "pet": "Rex"
    }
  ]
}
```

---

### 5.2 Estatísticas por Período

```
GET /dashboard/estatisticas?data_inicio=2026-05-01&data_fim=2026-05-31
Headers: Authorization: Bearer {token}

Response 200:
{
  "periodo": "2026-05-01 até 2026-05-31",
  "total_agendamentos": 45,
  "total_realizado": 38,
  "total_cancelado": 3,
  "total_pendente": 4,
  "novos_clientes": 3,
  "novos_pets": 5,
  "tipos_atendimento": {
    "Consulta": 25,
    "Vacinação": 12,
    "Banho": 8
  }
}
```

---

## 6. TRATAMENTO DE ERROS

### Erros Comuns

```
400 Bad Request
{
  "erro": "Dados inválidos",
  "detalhes": "Campo 'email' é obrigatório"
}

401 Unauthorized
{
  "erro": "Token inválido ou expirado"
}

403 Forbidden
{
  "erro": "Acesso negado"
}

404 Not Found
{
  "erro": "Recurso não encontrado"
}

409 Conflict
{
  "erro": "Recurso já existe"
}

500 Internal Server Error
{
  "erro": "Erro interno do servidor"
}
```

---

## 7. AUTENTICAÇÃO (JWT)

### Como usar o token

```
1. Fazer login → recebe token
2. Incluir em todas as requisições:
   Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

3. Token expira em: 7 dias
4. Se expirar → fazer login novamente
```

---

## 8. PAGINAÇÃO (Para depois)

```
GET /clientes?pagina=1&limite=10

Response 200:
{
  "total": 50,
  "pagina": 1,
  "limite": 10,
  "total_paginas": 5,
  "clientes": [...]
}
```

---

## RESUMO DOS ENDPOINTS

| Método | Endpoint | Descrição |
|---|---|---|
| POST | `/auth/signup` | Cadastro |
| POST | `/auth/login` | Login |
| GET | `/clientes` | Listar clientes |
| POST | `/clientes` | Criar cliente |
| GET | `/clientes/:id` | Ver cliente |
| PUT | `/clientes/:id` | Editar cliente |
| DELETE | `/clientes/:id` | Deletar cliente |
| GET | `/clientes/:id/pets` | Listar pets |
| POST | `/clientes/:id/pets` | Criar pet |
| GET | `/pets/:id` | Ver pet |
| PUT | `/pets/:id` | Editar pet |
| DELETE | `/pets/:id` | Deletar pet |
| GET | `/agendamentos` | Listar agendamentos |
| GET | `/agendamentos/hoje` | Agendamentos de hoje |
| POST | `/agendamentos` | Criar agendamento |
| GET | `/agendamentos/:id` | Ver agendamento |
| PUT | `/agendamentos/:id` | Editar agendamento |
| PUT | `/agendamentos/:id/realizado` | Marcar como realizado |
| DELETE | `/agendamentos/:id` | Cancelar agendamento |
| GET | `/dashboard/resumo` | Dashboard resumo |
| GET | `/dashboard/estatisticas` | Estatísticas |

**Total: 21 endpoints**

