#!/bin/bash
# Script de inicialização completa do VetAssist
# Inicia: Backend (5000) + Frontend (5173) + Cloudflare Tunnel (acesso mobile)
#
# Obs: migramos do ngrok para o Cloudflare Tunnel porque o plano gratuito do
# ngrok esbarrou no limite mensal de banda (ERR_NGROK_725). O túnel rápido do
# Cloudflare (trycloudflare.com) não tem cota de banda, mas a URL muda a cada
# reinício — ela é impressa no fim deste script.

echo "🔄 Reiniciando VetAssist..."

CLOUDFLARED="/c/Program Files (x86)/cloudflared/cloudflared.exe"

# Matar processos antigos nas portas 5000 e 5173
for PORT in 5000 5173; do
  PID=$(netstat -ano 2>/dev/null | grep ":$PORT.*LISTENING" | awk '{print $5}' | head -1)
  if [ -n "$PID" ]; then
    echo "  Matando processo na porta $PORT (PID $PID)..."
    taskkill //F //PID $PID 2>/dev/null >/dev/null
  fi
done

# Matar túneis antigos (ngrok legado + cloudflared)
pkill -f "ngrok" 2>/dev/null
pkill -f "cloudflared" 2>/dev/null
sleep 2

# Iniciar Backend
echo "▶️  Iniciando Backend..."
cd "/d/Claude Code/Vet.Assist/backend" && nohup npm start > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
echo "   Backend PID: $BACKEND_PID"

# Iniciar Frontend
echo "▶️  Iniciando Frontend..."
cd "/d/Claude Code/Vet.Assist/frontend" && nohup npm run dev > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "   Frontend PID: $FRONTEND_PID"

# Aguardar servidores subirem
sleep 6

# Iniciar Cloudflare Tunnel (acesso mobile) — aponta para o frontend (5173)
echo "▶️  Iniciando Cloudflare Tunnel..."
: > /tmp/cloudflared.log
nohup "$CLOUDFLARED" tunnel --url http://localhost:5173 > /tmp/cloudflared.log 2>&1 &
TUNNEL_PID=$!
echo "   Cloudflared PID: $TUNNEL_PID"

# Esperar a URL pública aparecer no log (até ~20s)
TUNNEL_URL=""
for i in $(seq 1 20); do
  TUNNEL_URL=$(grep -oE "https://[a-z0-9-]+\.trycloudflare\.com" /tmp/cloudflared.log 2>/dev/null | head -1)
  [ -n "$TUNNEL_URL" ] && break
  sleep 1
done

# Status dos servidores
echo ""
echo "═══════════════════════════════════════"
echo "📊 STATUS"
echo "═══════════════════════════════════════"
curl -s -o /dev/null -w "Backend (5000):  %{http_code}\n" http://localhost:5000/api/status
curl -s -o /dev/null -w "Frontend (5173): %{http_code}\n" http://localhost:5173

if [ -n "$TUNNEL_URL" ]; then
  echo "Túnel público:   $TUNNEL_URL"
else
  echo "Túnel: ❌ não respondendo (veja /tmp/cloudflared.log)"
fi

echo "═══════════════════════════════════════"
echo "✅ VetAssist pronto!"
echo "   Desktop: http://localhost:5173"
echo "   Mobile:  $TUNNEL_URL"
echo "═══════════════════════════════════════"
