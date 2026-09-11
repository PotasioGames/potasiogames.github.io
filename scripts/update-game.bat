@echo off
set "SRC=C:\Users\augus\Documents\Unity Projects\redjar-challenge\Build_WebGL\Build"
set "DEST=public\JedRar\Build"

echo =======================================================
echo  Actualizando build de Unity WebGL en el sitio web...
echo =======================================================
echo.

if not exist "%SRC%" (
    echo [ERROR] No se encontro la carpeta de compilacion de Unity en:
    echo "%SRC%"
    echo.
    echo Asegurate de compilar el proyecto en Unity primero.
    exit /b 1
)

echo Copiando archivos desde:
echo "%SRC%"
echo hacia:
echo "%DEST%"
echo.

xcopy /E /I /Y "%SRC%" "%DEST%"

echo.
echo =======================================================
echo  [EXITO] Archivos de Unity actualizados correctamente.
echo.
echo  Proximos pasos:
echo    1. git add public/JedRar/Build
echo    2. git commit -m "chore: actualizar build de Unity"
echo    3. git push origin dev
echo =======================================================
