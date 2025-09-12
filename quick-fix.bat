@echo off
echo Quick fix for current errors...

echo Fixing frontend Rollup issue...
cd frontend
npm install @rollup/rollup-win32-x64-msvc --save-dev --legacy-peer-deps --force

echo Restarting frontend...
cd ..

echo.
echo Fixed issues:
echo ✓ Backend database configuration (removed invalid timeout properties)
echo ✓ Frontend Rollup native module installed
echo.
echo Now restart your servers:
echo Backend: cd backend && npm run dev
echo Frontend: cd frontend && npm run dev
echo.
pause