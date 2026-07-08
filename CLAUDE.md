# VetAssist - Instruções para Claude

## 🔄 REGRA: Reiniciar/Inicializar App

**SEMPRE** que o usuário pedir para "reiniciar o app", "iniciar o app", "subir o servidor", "rodar o sistema" ou similar, executar a **inicialização completa**:

1. **Matar processos antigos** nas portas 5000 e 5173 e o túnel (cloudflared/ngrok)
2. **Iniciar Backend** (porta 5000) em background
3. **Iniciar Frontend** (porta 5173) em background
4. **Iniciar Cloudflare Tunnel** apontando para 5173 (acesso mobile)
5. **Verificar status** dos 3 serviços
6. **Reportar URLs** ao usuário (localhost + URL do túnel)

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
pkill -f "cloudflared" 2>/dev/null

# 2. Backend
cd "/d/Claude Code/Vet.Assist/backend" && nohup npm start > /tmp/backend.log 2>&1 &

# 3. Frontend
cd "/d/Claude Code/Vet.Assist/frontend" && nohup npm run dev > /tmp/frontend.log 2>&1 &

sleep 6

# 4. Cloudflare Tunnel (usar o caminho completo do .exe — não está no PATH do bash)
: > /tmp/cloudflared.log
nohup "/c/Program Files (x86)/cloudflared/cloudflared.exe" tunnel --url http://localhost:5173 > /tmp/cloudflared.log 2>&1 &

sleep 8

# 5. Verificar
curl -s -o /dev/null -w "Backend: %{http_code}\n" http://localhost:5000/api/status
curl -s -o /dev/null -w "Frontend: %{http_code}\n" http://localhost:5173
grep -oE "https://[a-z0-9-]+\.trycloudflare\.com" /tmp/cloudflared.log | head -1
```

### ⚠️ Observações importantes:
- **Túnel atual: Cloudflare** (`cloudflared`). Migramos do ngrok porque o plano free do ngrok estourou o limite mensal de banda (ERR_NGROK_725). O túnel rápido do Cloudflare (`trycloudflare.com`) não tem cota de banda.
- Usar o caminho completo `"/c/Program Files (x86)/cloudflared/cloudflared.exe"` (não está no PATH do Git Bash)
- A URL do túnel (`https://algo.trycloudflare.com`) **muda a cada reinício** — sempre reportar a URL nova ao usuário
- `frontend/vite.config.js` já tem `.trycloudflare.com` em `allowedHosts` (sem isso o Vite responde 403)
- Logs ficam em `/tmp/backend.log`, `/tmp/frontend.log`, `/tmp/cloudflared.log`

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
