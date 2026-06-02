@echo off
echo ========================================
echo   NHCX FHIR Convertor - Auto Setup
echo ========================================
echo.

echo [1/4] Installing backend dependencies...
cd backend
call npm install --legacy-peer-deps
if %errorlevel% neq 0 (
    echo ERROR: Backend install failed. Try running as Administrator.
    pause
    exit /b 1
)

echo.
echo [2/4] Installing frontend dependencies...
cd ..\frontend
call npm install --legacy-peer-deps
if %errorlevel% neq 0 (
    echo ERROR: Frontend install failed.
    pause
    exit /b 1
)

cd ..
echo.
echo ========================================
echo  SUCCESS! Now run these in VS Code:
echo ========================================
echo.
echo  Terminal 1:  cd backend  then  npm run dev
echo  Terminal 2:  cd frontend then  npm run dev
echo.
echo  Then open: http://localhost:3000
echo ========================================
pause
