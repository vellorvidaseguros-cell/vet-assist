Write-Host "⏳ Aguardando apps iniciarem..." -ForegroundColor Yellow
Start-Sleep -Seconds 20

Write-Host "`n✅ Iniciando NGROK para AMBAS as portas..." -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

# Landing Page (3000)
Write-Host "📄 Landing Page (3000)..." -ForegroundColor Cyan
Start-Process -FilePath "C:\Users\renat\AppData\Roaming\npm\ngrok.cmd" `
    -ArgumentList "http 3000" `
    -NoNewWindow

Start-Sleep -Seconds 3

# App (5173)
Write-Host "📱 App VetAssist (5173)..." -ForegroundColor Cyan
Start-Process -FilePath "C:\Users\renat\AppData\Roaming\npm\ngrok.cmd" `
    -ArgumentList "http 5173" `
    -NoNewWindow

Write-Host "`n⏳ Aguarde 15 segundos para URLs aparecerem...`n" -ForegroundColor Yellow
Start-Sleep -Seconds 15

Write-Host "🔍 Capturando URLs...`n" -ForegroundColor Green

try {
    $response = Invoke-WebRequest -Uri "http://localhost:4040/api/tunnels" -UseBasicParsing -ErrorAction Stop
    $data = $response.Content | ConvertFrom-Json
    $tunnels = $data.tunnels | Sort-Object -Property { $_.config.addr }

    Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║  ✅ TUDO PRONTO PARA TESTAR!                            ║" -ForegroundColor Green
    Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Green

    foreach ($tunnel in $tunnels) {
        if ($tunnel.config.addr -like "*3000*") {
            Write-Host "📄 LANDING PAGE:" -ForegroundColor Yellow
            Write-Host "   $($tunnel.public_url)`n" -ForegroundColor Cyan
        }
        elseif ($tunnel.config.addr -like "*5173*") {
            Write-Host "📱 APP VETASSIST:" -ForegroundColor Yellow
            Write-Host "   $($tunnel.public_url)`n" -ForegroundColor Cyan
        }
    }

    Write-Host "✅ Compartilhe estas URLs com qualquer pessoa!`n" -ForegroundColor Green
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "`n⚠️  NÃO FECHE ESTA JANELA ENQUANTO ESTIVER TESTANDO!`n" -ForegroundColor Red

} catch {
    Write-Host "⚠️  Erro ao capturar URLs. Aguarde mais um pouco..." -ForegroundColor Yellow
}

# Manter janela aberta
Read-Host "Pressione Enter para encerrar (NGROK será fechado)"
