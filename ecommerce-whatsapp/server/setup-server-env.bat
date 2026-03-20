@echo off
echo Configurando variables de entorno del servidor...

if not exist .env (
    echo Creando archivo .env desde .env.example...
    copy .env.example .env
    echo.
    echo IMPORTANTE: Debes configurar las claves de Supabase en el archivo .env
    echo 1. Ve a tu proyecto de Supabase
    echo 2. Configuracion > API
    echo 3. Copia la URL y las claves
    echo 4. Reemplaza los valores en .env
    echo.
    pause
) else (
    echo El archivo .env ya existe
)

echo Configuracion completada!
