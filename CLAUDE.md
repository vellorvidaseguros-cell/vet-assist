# VetAssist - Instruções para Claude

## 🔄 REGRA: Reiniciar/Inicializar App

**SEMPRE** que o usuário pedir para "reiniciar o app", "iniciar o app", "subir o servidor", "rodar o sistema" ou similar, executar a **inicialização completa**:

1. **Matar processos antigos** nas portas 5000 e 5173 e ngrok
2. **Iniciar Backend** (porta 5000) em background
3. **Iniciar Frontend** (porta 5173) em background
4. **Iniciar Ngrok** apontando para 5173 (acesso mobile)
5. **Verificar status** dos 3 serviços
6. **Reportar URLs** ao usuário (localhost + ngrok)

### Comando único:
```bash
bash "/d/Claude Code/Vet.Assist/reiniciar-app.sh"
```

### Ou em etapas (quando o script não funcionar):
```bash
# 1. Matar processos antigos
for PORT in 5000 5173; do
  PID=$(netstat -ano | grep ":$PORT.*LISTENING" | awk '{print $5}' | head -1)
  [ -n "$PID" ] && taskkill //F //PID $PID 2>/dev/null
done
pkill -f "ngrok" 2>/dev/null

# 2. Backend
cd "/d/Claude Code/Vet.Assist/backend" && nohup npm start > /tmp/backend.log 2>&1 &

# 3. Frontend
cd "/d/Claude Code/Vet.Assist/frontend" && nohup npm run dev > /tmp/frontend.log 2>&1 &

sleep 6

# 4. Ngrok (use ngrok.cmd, NÃO ngrok diretamente — bug no shell bash do Windows)
nohup ngrok.cmd http 5173 > /tmp/ngrok.log 2>&1 &

sleep 5

# 5. Verificar
curl -s -o /dev/null -w "Backend: %{http_code}\n" http://localhost:5000/api/status
curl -s -o /dev/null -w "Frontend: %{http_code}\n" http://localhost:5173
curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"[^"]*"' | cut -d'"' -f4
```

### ⚠️ Observações importantes:
- **NÃO use `ngrok`** diretamente, sempre use **`ngrok.cmd`** (binário do npm tem bug "Exec format error" no Git Bash)
- Logs ficam em `/tmp/backend.log`, `/tmp/frontend.log`, `/tmp/ngrok.log`
- URL pública do ngrok muda cada vez (a menos que tenha plano fixo)
- Sempre reportar a URL nova do ngrok ao usuário após reiniciar

## 📂 Estrutura do Projeto

- **Backend**: `/d/Claude Code/Vet.Assist/backend` (Node.js + Express + Sequelize + SQLite)
- **Frontend**: `/d/Claude Code/Vet.Assist/frontend` (React + Vite)
- **Banco**: SQLite (desenvolvimento) em `backend/database.sqlite`

## 🎯 Stack
- React + Vite
- Express + Sequelize
- SQLite (dev) / PostgreSQL (prod)
- Socket.IO
- Service Worker (PWA)

## 🌐 Idioma
- Comunicar **APENAS em português** com o usuário
