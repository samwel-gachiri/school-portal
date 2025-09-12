@echo off
echo Fixing and starting School Portal...

REM Clean and reinstall frontend dependencies
echo Cleaning frontend dependencies...
cd frontend
if exist "node_modules" rmdir /s /q node_modules
if exist "package-lock.json" del package-lock.json
echo Installing frontend dependencies...
npm install --legacy-peer-deps --force
echo Installing Rollup native module...
npm install @rollup/rollup-win32-x64-msvc --save-dev --legacy-peer-deps

REM Clean and reinstall backend dependencies
echo Cleaning backend dependencies...
cd ..\backend
if exist "node_modules" rmdir /s /q node_modules
if exist "package-lock.json" del package-lock.json
echo Installing backend dependencies...
npm install --legacy-peer-deps --force

REM Create .env files if they don't exist
if not exist ".env" (
    copy ".env.example" ".env"
    echo Created backend .env file
)

cd ..\frontend
if not exist ".env" (
    echo VITE_API_BASE_URL=http://localhost:3000/api > ".env"
    echo Created frontend .env file
)

cd ..

echo Starting servers...
start "Backend Server" cmd /k "cd backend && npm run dev"
timeout /t 3 /nobreak >nul
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo.
echo Servers starting...
echo Backend: http://localhost:3000
echo Frontend: http://localhost:5173
echo.
echo IMPORTANT: Update backend\.env with your database credentials!
echo Default login: admin / password123
echo.
pause