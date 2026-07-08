#!/bin/bash
# Script de inicialização completa do VetAssist
# Inicia: Backend (5000) + Frontend (5173)
#
# Acesso mobile: rede local (Wi-Fi), sem túnel externo. O celular precisa
# estar na MESMA rede Wi-Fi do computador. Não usamos mais ngrok/Cloudflare —
# ngrok estourou a cota de banda gratuita, e o Cloudflare Tunnel gera uma URL
# nova a cada reinício (obrigando login de novo no PWA). A rede local resolve
# isso: o IP não muda entre reinícios do app (só mudaria se o roteador
# reatribuir IP, o que é raro numa rede doméstica/clínica estável).

echo "🔄 Reiniciando VetAssist..."

# Matar processos antigos nas portas 5000 e 5173
for PORT in 5000 5173; do
  PID=$(netstat -ano 2>/dev/null | grep ":$PORT.*LISTENING" | awk '{print $5}' | head -1)
  if [ -n "$PID" ]; then
    echo "  Matando processo na porta $PORT (PID $PID)..."
    taskkill //F //PID $PID 2>/dev/null >/dev/null
  fi
done

# Matar túneis antigos, caso ainda existam de sessões anteriores
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

# Descobrir o IP da rede local (Wi-Fi) para acesso pelo celular
LAN_IP=$(ipconfig 2>/dev/null | grep -B 3 "192.168\|10\.\|172\." | grep -oE "IPv4.*: [0-9.]+" | grep -oE "[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+" | head -1)

# Status dos servidores
echo ""
echo "═══════════════════════════════════════"
echo "📊 STATUS"
echo "═══════════════════════════════════════"
curl -s -o /dev/null -w "Backend (5000):  %{http_code}\n" http://localhost:5000/api/status
curl -s -o /dev/null -w "Frontend (5173): %{http_code}\n" http://localhost:5173

echo "═══════════════════════════════════════"
echo "✅ VetAssist pronto!"
echo "   Desktop: http://localhost:5173"
if [ -n "$LAN_IP" ]; then
  echo "   Mobile (mesma Wi-Fi): http://$LAN_IP:5173"
else
  echo "   Mobile: ❌ não consegui detectar o IP da rede local — rode 'ipconfig' manualmente"
fi
echo "═══════════════════════════════════════"
