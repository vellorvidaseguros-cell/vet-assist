# 🚀 Instalação de Dependências - VetAssist

Se você está recebendo erros como **"Erro ao enviar arquivos"**, é porque as dependências ainda não foram instaladas.

## 📋 Pré-requisitos

- Node.js instalado
- npm ou yarn disponível no PATH

## ⚠️ Se npm não está funcionando no PowerShell

### Opção 1: Usar Command Prompt (cmd) ao invés de PowerShell

```cmd
cd D:\Claude Code\Vet.Assist
npm install
```

### Opção 2: Instalar Node.js novamente

1. Baixe Node.js de https://nodejs.org/ (versão LTS recomendada)
2. Execute o instalador
3. Reinicie o computador
4. Tente novamente

### Opção 3: Adicionar npm ao PATH manualmente

1. Encontre onde Node.js foi instalado (ex: `C:\Program Files\nodejs`)
2. Abra Variáveis de Ambiente (Environment Variables)
3. Adicione o caminho ao PATH do sistema
4. Reinicie o PowerShell/CMD

---

## 🔧 Instalação Passo a Passo

### Backend
```bash
# Navegar para o diretório raiz
cd "D:\Claude Code\Vet.Assist"

# Instalar dependências (incluindo multer)
npm install

# Iniciar o servidor backend
npm start
```

O servidor deve aparecer em: `http://localhost:5000`

### Frontend
```bash
# Em outro terminal, navegar para o diretório do frontend
cd "D:\Claude Code\Vet.Assist\frontend"

# Instalar dependências do frontend
npm install

# Iniciar o servidor frontend (Vite)
npm start
```

O frontend deve aparecer em: `http://localhost:3001` (ou próxima porta disponível)

---

## ✅ Como verificar se está tudo funcionando

1. **Backend rodando:**
   - Abra `http://localhost:5000/api/status` no navegador
   - Deve mostrar: `{"message": "[OK] Backend do VetAssist rodando!", ...}`

2. **Frontend rodando:**
   - Abra `http://localhost:3001` (ou a porta mostrada)
   - Deve aparecer a página de login

3. **Upload de fotos funcionando:**
   - Crie um agendamento
   - Clique no botão 📸
   - Tente enviar uma foto
   - Se enviou com sucesso, tudo está OK!

---

## 🆘 Se ainda tiver problemas

### Erro: "multer não encontrado"
```bash
# Reinstalar manualmente
cd "D:\Claude Code\Vet.Assist"
npm install multer@1.4.5-lts.1
npm start
```

### Erro: "npm: command not found"
- Node.js não está instalado ou não está no PATH
- Tente usar `npx` ao invés de `npm`
- Ou reinstale Node.js

### Erro: "ENOSPC" ou permissão negada
```bash
# Limpar cache do npm
npm cache clean --force

# Tentar instalar novamente
npm install
```

---

## 📦 O que será instalado

As seguintes dependências foram adicionadas ao `package.json`:

- **multer** - Para upload de arquivos/fotos
- Outras dependências existentes: express, sequelize, sqlite3, axios, etc.

---

## 💾 Estrutura de diretórios após instalação

```
D:\Claude Code\Vet.Assist\
├── node_modules/          ← Será criado após npm install
├── backend/
│   ├── uploads/           ← Fotos serão salvas aqui
│   ├── controllers/
│   ├── routes/
│   ├── middleware/
│   └── server.js
├── frontend/
│   ├── node_modules/      ← Será criado após npm install
│   └── src/
└── package.json
```

---

## 🎯 Resumo dos Comandos Principais

```bash
# Terminal 1: Backend
cd "D:\Claude Code\Vet.Assist"
npm install
npm start

# Terminal 2: Frontend
cd "D:\Claude Code\Vet.Assist\frontend"
npm install
npm start
```

Pronto! Agora o sistema deve estar totalmente funcional com:
- ✅ Upload de fotos (iPhone, Android, Desktop)
- ✅ Menu de status com 4 opções
- ✅ Histórico de consultas por proprietário e animal
- ✅ Geração de PDF
