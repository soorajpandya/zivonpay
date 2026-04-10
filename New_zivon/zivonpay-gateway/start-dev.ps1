# ZivonPay Development Starter Script

Write-Host "🚀 Starting ZivonPay Gateway Development Servers..." -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js is not installed. Please install Node.js 18+ first." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Node.js detected: $(node --version)" -ForegroundColor Green

# Check if backend dependencies are installed
if (-not (Test-Path "backend/node_modules")) {
    Write-Host "📦 Installing backend dependencies..." -ForegroundColor Yellow
    Push-Location backend
    npm install
    Pop-Location
    Write-Host "✅ Backend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✅ Backend dependencies already installed" -ForegroundColor Green
}

# Check if frontend dependencies are installed
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Yellow
    npm install
    Write-Host "✅ Frontend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✅ Frontend dependencies already installed" -ForegroundColor Green
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  Starting Development Servers" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "📡 Backend API will run on: http://localhost:5000" -ForegroundColor Magenta
Write-Host "🌐 Frontend will run on:   http://localhost:5173" -ForegroundColor Magenta
Write-Host ""
Write-Host "Press Ctrl+C to stop both servers" -ForegroundColor Yellow
Write-Host ""

# Start backend server in new window
$backendJob = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; npm run dev" -PassThru

# Wait a moment for backend to start
Start-Sleep -Seconds 2

# Start frontend server in new window
$frontendJob = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev" -PassThru

Write-Host "✅ Servers started successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Backend Process ID: $($backendJob.Id)" -ForegroundColor Gray
Write-Host "📋 Frontend Process ID: $($frontendJob.Id)" -ForegroundColor Gray
Write-Host ""
Write-Host "To stop the servers, close the terminal windows or run:" -ForegroundColor Yellow
Write-Host "  Stop-Process -Id $($backendJob.Id), $($frontendJob.Id)" -ForegroundColor Gray
Write-Host ""
Write-Host "🎉 Happy coding!" -ForegroundColor Cyan
