# VetAssist - Instruções para Claude

## 🔄 REGRA: Reiniciar/Inicializar App

**SEMPRE** que o usuário pedir para "reiniciar o app", "iniciar o app", "subir o servidor", "rodar o sistema" ou similar, executar a **inicialização completa**:

1. **Matar processos antigos** nas portas 5000 e 5173
2. **Iniciar Backend** (porta 5000) em background
3. **Iniciar Frontend** (porta 5173) em background
4. **Verificar status** dos 2 serviços
5. **Reportar URLs** ao usuário (localhost + IP da rede local para o celular)

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

# 2. Backend
cd "/d/Claude Code/Vet.Assist/backend" && nohup npm start > /tmp/backend.log 2>&1 &

# 3. Frontend
cd "/d/Claude Code/Vet.Assist/frontend" && nohup npm run dev > /tmp/frontend.log 2>&1 &

sleep 6

# 4. Verificar
curl -s -o /dev/null -w "Backend: %{http_code}\n" http://localhost:5000/api/status
curl -s -o /dev/null -w "Frontend: %{http_code}\n" http://localhost:5173
ipconfig | grep -A 3 "192.168\|10\.\|172\." | grep IPv4
```

### ⚠️ Acesso mobile: rede local, SEM túnel externo
- O celular acessa pela **mesma rede Wi-Fi** do computador, direto pelo IP local: `http://<IP-DA-REDE-LOCAL>:5173` (ex: `http://192.168.15.27:5173`).
- **Não usar mais ngrok nem Cloudflare Tunnel.** Histórico: ngrok estourou a cota de banda gratuita (ERR_NGROK_725); o Cloudflare Tunnel funcionava mas gerava uma URL nova a cada reinício, forçando login de novo no PWA a cada vez. A rede local resolve isso, pois o IP não muda entre reinícios do app.
- `frontend/vite.config.js` já tem o IP local em `allowedHosts` (sem isso o Vite responde 403).
- Logs ficam em `/tmp/backend.log`, `/tmp/frontend.log`.
- **Limitação:** só funciona com o celular na mesma rede Wi-Fi do computador. Fora dessa rede, usar a versão publicada no Railway (ver seção abaixo).

## 🚀 Deploy para produção (Railway)

- App publicado com URL fixa: `https://vet-assist-app-production.up.railway.app` (nunca muda).
- Conta Railway: `vetassistapp-bit`, login via Gmail `vetflow.app@gmail.com`. Projeto: `vet-assist`.
- Deploy é **automático**: qualquer `git push` para `main` no GitHub (`vellorvidaseguros-cell/vet-assist`) dispara build + deploy na Railway, levando de 1 a 3 minutos.
- **Fluxo de trabalho combinado com o usuário:** testar mudanças em andamento sempre no ambiente local (rede Wi-Fi, instantâneo); ao final do dia, quando as mudanças do dia estiverem prontas e aprovadas, fazer commit + push para atualizar o Railway (a versão que o usuário usa no dia a dia).
- Antes de cada push para produção: rodar `npx vite build` no frontend e bumpar `CACHE_NAME` em `frontend/public/service-worker.js`, como já é feito no fluxo local.

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
