# Script para manter o servidor backend rodando
Write-Host "🚀 Iniciando servidor backend..." -ForegroundColor Green
Set-Location "c:\xampp\htdocs\Studiotreiax_1"

# Função para tratar Ctrl+C
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

try {
    node simple-backend.js
}
catch {
    Write-Host "❌ Erro no servidor: $_" -ForegroundColor Red
}

Write-Host "🛑 Servidor encerrado." -ForegroundColor Yellow