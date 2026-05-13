# Script para iniciar ngrok e expor a aplicação

Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  Instalando e iniciando ngrok...      ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Cyan

# Instalar ngrok globalmente
Write-Host "`n📦 Instalando ngrok..." -ForegroundColor Yellow
npm install -g ngrok

# Aguardar um momento
Start-Sleep -Seconds 2

# Iniciar ngrok
Write-Host "`n🚀 Iniciando ngrok na porta 5173..." -ForegroundColor Green
Write-Host "`n⏳ Aguarde 10-15 segundos para a URL aparecer..." -ForegroundColor Yellow
Write-Host "Quando aparecer, você verá algo como: https://xxxx-xxx-xxx.ngrok.io`n" -ForegroundColor Cyan

ngrok http 5173
