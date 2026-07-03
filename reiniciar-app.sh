#!/bin/bash
# Script de inicialização completa do VetAssist
# Inicia: Backend (5000) + Frontend (5173) + Ngrok (acesso mobile)

echo "🔄 Reiniciando VetAssist..."

# Matar processos antigos nas portas 5000 e 5173 e ngrok
for PORT in 5000 5173; do
  PID=$(netstat -ano 2>/dev/null | grep ":$PORT.*LISTENING" | awk '{print $5}' | head -1)
  if [ -n "$PID" ]; then
    echo "  Matando processo na porta $PORT (PID $PID)..."
    taskkill //F //PID $PID 2>/dev/null >/dev/null
  fi
done

# Matar ngrok antigo
pkill -f "ngrok" 2>/dev/null
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

# Iniciar Ngrok (acesso mobile)
echo "▶️  Iniciando Ngrok..."
nohup ngrok.cmd http 5173 > /tmp/ngrok.log 2>&1 &
NGROK_PID=$!
echo "   Ngrok PID: $NGROK_PID"
sleep 5

# Status dos servidores
echo ""
echo "═══════════════════════════════════════"
echo "📊 STATUS"
echo "═══════════════════════════════════════"
curl -s -o /dev/null -w "Backend (5000):  %{http_code}\n" http://localhost:5000/api/status
curl -s -o /dev/null -w "Frontend (5173): %{http_code}\n" http://localhost:5173

# URL pública do ngrok
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | grep -o '"public_url":"[^"]*"' | head -1 | cut -d'"' -f4)
if [ -n "$NGROK_URL" ]; then
  echo "Ngrok URL:       $NGROK_URL"
else
  echo "Ngrok: ❌ não respondendo"
fi

echo "═══════════════════════════════════════"
echo "✅ VetAssist pronto!"
echo "   Desktop: http://localhost:5173"
echo "   Mobile:  $NGROK_URL"
echo "═══════════════════════════════════════"
