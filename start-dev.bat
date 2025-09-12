@echo off
echo Starting School Portal Development Environment...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if backend .env exists
if not exist "backend\.env" (
    echo Warning: Backend .env file not found
    echo Copying from .env.example...
    copy "backend\.env.example" "backend\.env"
    echo Please edit backend\.env with your database credentials
)

REM Check if frontend .env exists
if not exist "frontend\.env" (
    echo Creating frontend .env file...
    echo VITE_API_BASE_URL=http://localhost:3000/api > "frontend\.env"
)

echo Installing backend dependencies...
cd backend
call npm install --no-optional
if %errorlevel% neq 0 (
    echo Warning: Some backend dependencies failed to install, continuing anyway...
)

echo Installing frontend dependencies...
cd ..\frontend
call npm install --no-optional
if %errorlevel% neq 0 (
    echo Warning: Some frontend dependencies failed to install, continuing anyway...
)

echo Starting development servers...
cd ..

REM Start backend in a new window
start "Backend Server" cmd /k "cd backend && npm run dev"

REM Wait a moment for backend to start
timeout /t 5 /nobreak >nul

REM Start frontend in a new window
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo Development servers are starting...
echo ========================================
echo Backend API: http://localhost:3000
echo Frontend App: http://localhost:5173
echo Health Check: http://localhost:3000/health
echo.
echo IMPORTANT SETUP STEPS:
echo 1. Update backend\.env with your database credentials
echo 2. Run the SQL script in backend\setup-database.sql on your database
echo 3. Default login: admin / password123
echo.
echo Press any key to exit...
pause >nul