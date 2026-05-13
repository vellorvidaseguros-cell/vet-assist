# VetAssist 🐾

Sistema de gestão para clínicas veterinárias com agendamentos, consultas, vacinação e financeiro.

---

## 🚀 COMEÇAR (WINDOWS)

### 1. Abrir CMD e ir para a pasta do projeto
```bash
cd D:\Claude Code\Vet.Assist
```

### 2. Instalar dependências
```bash
npm install
```
*(Demora 2-5 minutos, baixa bibliotecas)*

### 3. Rodar o servidor
```bash
npm start
```

Você verá:
```
🚀 Servidor rodando em http://localhost:5000
📊 Status: http://localhost:5000/api/status
```

### 4. Abrir navegador e testar
```
http://localhost:5000/api/status
```

---

## 📁 ESTRUTURA DO PROJETO

```
vet-assist/
├── backend/
│   ├── server.js           # Servidor principal
│   ├── models/             # Modelos do banco
│   ├── routes/             # Rotas da API
│   ├── controllers/        # Lógica de negócio
│   └── middleware/         # Autenticação, validação
├── frontend/               # App React (criará depois)
├── package.json            # Dependências
├── .env                    # Variáveis de ambiente
└── README.md              # Este arquivo
```

---

## 🛠️ COMANDOS ÚTEIS

```bash
# Rodar servidor com auto-reload (desenvolvimento)
npm run dev

# Instalar dependências do frontend também
npm run install-all

# Rodar frontend React
npm run client
```

---

## 🗄️ BANCO DE DADOS

### Instalar PostgreSQL (Windows)
1. Baixa: https://www.postgresql.org/download/windows/
2. Instala com senha padrão: `postgres`
3. Porta: `5432`

### Criar banco VetAssist
```sql
CREATE DATABASE vet_assist;
```

---

## ⚙️ CONFIGURAÇÃO

Edita `.env` se precisar mudar:
- `PORT` - Porta do servidor
- `DB_HOST` - Host do banco
- `DB_PASSWORD` - Senha PostgreSQL
- `JWT_SECRET` - Chave de segurança

---

## 📋 FEATURES DO MVP

- ✅ Cadastro de clientes e pets
- ✅ Agendamentos
- ✅ Registro de consultas
- ✅ Controle de vacinação
- ✅ Financeiro/Receitas
- ✅ Dashboard

---

## 🐛 PROBLEMAS?

Se der erro:
1. Verifica se Node está instalado: `node --version`
2. Verifica se npm funciona: `npm --version`
3. Deleta `node_modules` e roda `npm install` novamente
4. Verifica se porta 5000 está livre

---

## 📞 PRÓXIMOS PASSOS

- [ ] Configurar banco de dados PostgreSQL
- [ ] Criar modelos (Veterinários, Clientes, Pets, etc)
- [ ] Criar rotas da API
- [ ] Criar frontend React
- [ ] Integração com Google Sheets
- [ ] Deploy

---

**Pronto para começar? Rode `npm install` no CMD! 🚀**
