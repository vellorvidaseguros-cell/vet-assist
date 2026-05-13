# Script para iniciar ngrok com visibilidade total
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  INICIANDO NGROK - NÃO FECHE ESTA JANELA                 ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Parar ngrok anterior
Write-Host "🛑 Parando ngrok anterior..." -ForegroundColor Yellow
Get-Process ngrok -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Verificar se app está rodando
Write-Host "`n✅ Verificando se app está em http://localhost:5173..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5173" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
    Write-Host "✅ App está acessível!`n" -ForegroundColor Green
} catch {
    Write-Host "❌ ERRO: App NÃO está rodando em localhost:5173!" -ForegroundColor Red
    Write-Host "Execute 'npm run dev' no frontend antes!" -ForegroundColor Yellow
    Read-Host "Pressione Enter para sair"
    exit
}

# Iniciar ngrok
Write-Host "🚀 Iniciando ngrok http 5173...`n" -ForegroundColor Green
Write-Host "⏳ Aguarde aparecer a URL (leva 10-15 segundos)`n" -ForegroundColor Yellow
Write-Host "═════════════════════════════════════════════════════════════`n" -ForegroundColor Cyan

& "C:\Users\renat\AppData\Roaming\npm\ngrok.cmd" http 5173 --log=stdout

Write-Host "`n═════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "❌ Ngrok encerrou. NÃO FECHE esta janela até terminar os testes!" -ForegroundColor Red
Read-Host "Pressione Enter"
