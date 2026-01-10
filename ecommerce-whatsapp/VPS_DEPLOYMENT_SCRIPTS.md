# 🚀 Scripts de Automatización para Despliegue en VPS

**Magnolia Novedades - E-commerce WhatsApp**

Este documento contiene scripts listos para usar que automatizan el proceso de despliegue.

---

## 📋 Scripts Disponibles

1. [Script de Instalación Inicial](#script-de-instalación-inicial-completo)
2. [Script de Despliegue](#script-de-despliegue-automático)
3. [Script de Monitoreo](#script-de-monitoreo)
4. [Script de Backup](#script-de-backup)
5. [Script de Restauración](#script-de-restauración)

---

## 🔧 Script de Instalación Inicial (Completo)

**Nombre:** `initial-setup.sh`

**Uso:**
```bash
# En tu máquina local
scp initial-setup.sh deployer@TU_IP_VPS:/home/deployer/

# En la VPS
ssh deployer@TU_IP_VPS
chmod +x ~/initial-setup.sh
./initial-setup.sh
```

**Contenido:**
```bash
#!/bin/bash

#################################
# SCRIPT INSTALACIÓN INICIAL VPS
# Magnolia Novedades
#################################

set -e  # Exit on error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funciones auxiliares
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verificar si es root
if [ "$EUID" -eq 0 ]; then 
    log_error "No ejecutar este script como root"
    exit 1
fi

log_info "==================================="
log_info "Iniciando instalación VPS"
log_info "==================================="

# Variables de configuración
read -p "Ingresa tu dominio (ej: tudominio.com): " DOMAIN
read -p "Ingresa tu dirección IP de correo (opcional): " EMAIL
read -p "Ingresa la URL de tu repositorio Git (opcional): " GIT_REPO

# Valores por defecto
EMAIL=${EMAIL:-admin@$DOMAIN}
APP_DIR="/home/deployer/app"

log_info "Dominio: $DOMAIN"
log_info "Email: $EMAIL"
log_info "Directorio de aplicación: $APP_DIR"

# ============ FASE 1: ACTUALIZAR SISTEMA ============
log_info "FASE 1: Actualizando sistema..."
sudo apt update
sudo apt upgrade -y
sudo apt install -y curl wget git nano htop unzip

log_success "Sistema actualizado"

# ============ FASE 2: INSTALAR NODE.JS ============
log_info "FASE 2: Instalando Node.js 20 LTS..."

if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
else
    log_warning "Node.js ya está instalado"
fi

NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)

log_success "Node.js instalado: $NODE_VERSION"
log_success "npm instalado: $NPM_VERSION"

# ============ FASE 3: INSTALAR PM2 ============
log_info "FASE 3: Instalando PM2..."

if ! npm list -g pm2 &> /dev/null; then
    sudo npm install -g pm2
    pm2 startup
    pm2 save
else
    log_warning "PM2 ya está instalado"
fi

log_success "PM2 instalado"

# ============ FASE 4: INSTALAR NGINX ============
log_info "FASE 4: Instalando Nginx..."

if ! command -v nginx &> /dev/null; then
    sudo apt install -y nginx
    sudo systemctl start nginx
    sudo systemctl enable nginx
else
    log_warning "Nginx ya está instalado"
fi

log_success "Nginx instalado"

# ============ FASE 5: INSTALAR CERTBOT ============
log_info "FASE 5: Instalando Certbot (SSL)..."

if ! command -v certbot &> /dev/null; then
    sudo apt install -y certbot python3-certbot-nginx
else
    log_warning "Certbot ya está instalado"
fi

log_success "Certbot instalado"

# ============ FASE 6: INSTALAR FAIL2BAN ============
log_info "FASE 6: Instalando Fail2Ban..."

if ! command -v fail2ban-client &> /dev/null; then
    sudo apt install -y fail2ban
    sudo systemctl start fail2ban
    sudo systemctl enable fail2ban
else
    log_warning "Fail2Ban ya está instalado"
fi

log_success "Fail2Ban instalado"

# ============ FASE 7: CREAR ESTRUCTURA DE DIRECTORIOS ============
log_info "FASE 7: Creando estructura de directorios..."

mkdir -p $APP_DIR/{server,logs,backups}
chmod 755 $APP_DIR

log_success "Directorios creados"

# ============ FASE 8: CLONAR O COPIAR APLICACIÓN ============
log_info "FASE 8: Descargando aplicación..."

if [ ! -z "$GIT_REPO" ]; then
    if [ -d "$APP_DIR/.git" ]; then
        log_warning "Repositorio git ya existe, actualizando..."
        cd $APP_DIR
        git pull
    else
        git clone $GIT_REPO $APP_DIR
    fi
else
    log_warning "No se proporcionó repositorio Git"
    log_warning "Necesitarás copiar los archivos manualmente con: scp"
fi

# ============ FASE 9: INSTALAR DEPENDENCIAS ============
log_info "FASE 9: Instalando dependencias..."

if [ -f "$APP_DIR/server/package.json" ]; then
    cd $APP_DIR/server
    npm install --production
    log_success "Dependencias instaladas"
else
    log_warning "No se encontró package.json"
fi

# ============ FASE 10: CREAR ARCHIVO .env ============
log_info "FASE 10: Creando archivo .env..."

if [ ! -f "$APP_DIR/server/.env" ]; then
    cat > $APP_DIR/server/.env <<'ENVFILE'
NODE_ENV=production
PORT=3000
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=your_super_secret_jwt_key_min_32_chars
JWT_EXPIRE=30d
LOG_LEVEL=info
CORS_ORIGIN=https://your-domain.com
ENVFILE
    chmod 600 $APP_DIR/server/.env
    log_warning "Archivo .env creado, REEMPLAZA los valores"
else
    log_warning "Archivo .env ya existe"
fi

# ============ FASE 11: CREAR CONFIGURACIÓN NGINX ============
log_info "FASE 11: Configurando Nginx..."

sudo tee /etc/nginx/sites-available/ecommerce-api > /dev/null <<NGINXFILE
upstream node_app {
    least_conn;
    server localhost:3001;
    server localhost:3002;
    server localhost:3003;
}

server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;

    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    limit_req_zone \$binary_remote_addr zone=api:10m rate=100r/m;

    location ~ ^/api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://node_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /uploads/ {
        alias $APP_DIR/server/uploads/;
        expires 30d;
    }

    access_log /var/log/nginx/ecommerce-api.log;
    error_log /var/log/nginx/ecommerce-api-error.log;
}
NGINXFILE

sudo ln -sf /etc/nginx/sites-available/ecommerce-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

log_success "Nginx configurado"

# ============ FASE 12: CREAR CERTIFICADO SSL ============
log_info "FASE 12: Generando certificado SSL..."

if [ ! -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    sudo certbot certonly --nginx -d $DOMAIN -d www.$DOMAIN -m $EMAIL -n --agree-tos
    log_success "Certificado SSL generado"
else
    log_warning "Certificado SSL ya existe"
fi

# ============ FASE 13: CONFIGURAR UFW ============
log_info "FASE 13: Configurando firewall (UFW)..."

if ! sudo ufw status | grep -q active; then
    sudo ufw allow 22/tcp
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    sudo ufw --force enable
    log_success "Firewall habilitado"
else
    log_warning "Firewall ya está habilitado"
fi

# ============ FASE 14: CREAR ARCHIVO ECOSYSTEM.CONFIG.JS ============
log_info "FASE 14: Creando configuración PM2..."

cat > $APP_DIR/ecosystem.config.js <<'PMFILE'
module.exports = {
  apps: [
    {
      name: 'ecommerce-api-1',
      script: './server/src/server.js',
      instances: 1,
      env: { NODE_ENV: 'production', PORT: 3001 },
      error_file: './logs/app-error-1.log',
      out_file: './logs/app-out-1.log'
    },
    {
      name: 'ecommerce-api-2',
      script: './server/src/server.js',
      instances: 1,
      env: { NODE_ENV: 'production', PORT: 3002 },
      error_file: './logs/app-error-2.log',
      out_file: './logs/app-out-2.log'
    },
    {
      name: 'ecommerce-api-3',
      script: './server/src/server.js',
      instances: 1,
      env: { NODE_ENV: 'production', PORT: 3003 },
      error_file: './logs/app-error-3.log',
      out_file: './logs/app-out-3.log'
    }
  ]
};
PMFILE

log_success "Configuración PM2 creada"

# ============ RESUMEN FINAL ============
log_info "==================================="
log_success "¡INSTALACIÓN COMPLETADA!"
log_info "==================================="

echo ""
echo -e "${YELLOW}PASOS SIGUIENTES:${NC}"
echo ""
echo "1. Edita el archivo .env con tus credenciales:"
echo "   nano $APP_DIR/server/.env"
echo ""
echo "2. Inicia la aplicación:"
echo "   cd $APP_DIR"
echo "   pm2 start ecosystem.config.js --env production"
echo ""
echo "3. Verifica el estado:"
echo "   pm2 status"
echo "   pm2 logs"
echo ""
echo "4. Visita tu sitio:"
echo "   https://$DOMAIN/api/health"
echo ""
echo "5. Para restaurar persistencia de PM2:"
echo "   pm2 startup"
echo "   pm2 save"
echo ""

log_success "Script completado sin errores"
```

---

## 🚀 Script de Despliegue Automático

**Nombre:** `deploy.sh`

**Uso:**
```bash
./deploy.sh
```

**Contenido:**
```bash
#!/bin/bash

#################################
# SCRIPT DE DESPLIEGUE
# Magnolia Novedades
#################################

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

APP_DIR="/home/deployer/app"
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')

log_info "=================================="
log_info "Iniciando despliegue"
log_info "=================================="

# ============ BACKUP ============
log_info "Creando backup..."
mkdir -p $APP_DIR/backups
tar -czf $APP_DIR/backups/backup_$TIMESTAMP.tar.gz \
    $APP_DIR/server \
    --exclude=node_modules \
    --exclude=uploads \
    2>/dev/null || log_warning "No se pudo crear backup completo"

# ============ DESCARGAR CAMBIOS ============
log_info "Descargando cambios..."
cd $APP_DIR

if [ -d ".git" ]; then
    git fetch origin
    git reset --hard origin/main
    log_success "Cambios descargados"
else
    log_warning "No es un repositorio git"
fi

# ============ INSTALAR DEPENDENCIAS ============
log_info "Instalando dependencias..."
cd $APP_DIR/server
npm install --production
log_success "Dependencias instaladas"

# ============ PARAR APLICACIÓN ============
log_info "Parando aplicación anterior..."
pm2 stop all 2>/dev/null || log_warning "No hay procesos PM2 activos"

# ============ INICIAR APLICACIÓN ============
log_info "Iniciando aplicación..."
cd $APP_DIR
pm2 start ecosystem.config.js --env production

# ============ VERIFICAR HEALTH CHECK ============
log_info "Verificando salud de la aplicación..."
sleep 2

for i in {1..10}; do
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://localhost/api/health 2>/dev/null || echo "000")
    
    if [ "$RESPONSE" == "200" ]; then
        log_success "Health check pasado ✓"
        break
    fi
    
    if [ $i -eq 10 ]; then
        log_error "Health check fallido después de 10 intentos"
        log_warning "Revertiendo a backup..."
        pm2 stop all
        tar -xzf $APP_DIR/backups/backup_$TIMESTAMP.tar.gz -C /
        pm2 start ecosystem.config.js --env production
        exit 1
    fi
    
    log_warning "Intento $i/10... (Respuesta: $RESPONSE)"
    sleep 1
done

# ============ LIMPIAR LOGS ============
log_info "Limpiando logs antiguos..."
find $APP_DIR/logs -name "*.log" -mtime +30 -delete

log_info "=================================="
log_success "¡DESPLIEGUE COMPLETADO!"
log_info "=================================="

pm2 status
pm2 logs --lines 20
```

---

## 📊 Script de Monitoreo

**Nombre:** `monitor.sh`

**Uso:**
```bash
./monitor.sh
```

**Contenido:**
```bash
#!/bin/bash

#################################
# SCRIPT DE MONITOREO
# Magnolia Novedades
#################################

INTERVAL=${1:-30}  # Segundos entre actualizaciones
APP_DIR="/home/deployer/app"

while true; do
    clear
    
    echo "========================================="
    echo "MONITOREO - $(date '+%Y-%m-%d %H:%M:%S')"
    echo "========================================="
    echo ""
    
    # Estado de PM2
    echo "📊 ESTADO PM2:"
    pm2 status
    echo ""
    
    # Recursos del sistema
    echo "💻 RECURSOS DEL SISTEMA:"
    echo "Memoria:"
    free -h | head -2 | tail -1
    echo ""
    echo "Disco:"
    df -h | grep -E '/$|/home' | awk '{print $1, $2, $3, $5}'
    echo ""
    
    # Procesos activos
    echo "🔄 PROCESOS NODEJS:"
    ps aux | grep node | grep -v grep | wc -l
    echo ""
    
    # Última línea de logs
    echo "📝 ÚLTIMOS LOGS:"
    tail -5 $APP_DIR/logs/app-out-*.log 2>/dev/null || echo "Sin logs disponibles"
    echo ""
    
    # Health check
    echo "🏥 HEALTH CHECK:"
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://localhost/api/health 2>/dev/null || echo "Error")
    if [ "$HTTP_CODE" == "200" ]; then
        echo "✅ API respondiendo (Code: 200)"
    else
        echo "❌ API NO RESPONDE (Code: $HTTP_CODE)"
    fi
    echo ""
    
    echo "Próxima actualización en $INTERVAL segundos..."
    echo "Presiona Ctrl+C para salir"
    sleep $INTERVAL
done
```

---

## 🔄 Script de Backup

**Nombre:** `backup.sh`

**Uso:**
```bash
./backup.sh
# O automáticamente con cron
```

**Contenido:**
```bash
#!/bin/bash

#################################
# SCRIPT DE BACKUP
# Magnolia Novedades
#################################

APP_DIR="/home/deployer/app"
BACKUP_DIR="$APP_DIR/backups"
RETENTION_DAYS=30
DATE=$(date '+%Y%m%d_%H%M%S')

echo "🔄 Iniciando backup..."

# Crear backup
tar -czf $BACKUP_DIR/backup_$DATE.tar.gz \
    $APP_DIR/server \
    $APP_DIR/ecosystem.config.js \
    --exclude=node_modules \
    --exclude=uploads \
    --exclude=.git \
    2>/dev/null

if [ $? -eq 0 ]; then
    SIZE=$(du -h $BACKUP_DIR/backup_$DATE.tar.gz | cut -f1)
    echo "✅ Backup creado: backup_$DATE.tar.gz ($SIZE)"
else
    echo "❌ Error creando backup"
    exit 1
fi

# Eliminar backups antiguos
DELETED=$(find $BACKUP_DIR -name "backup_*.tar.gz" -mtime +$RETENTION_DAYS -delete -print | wc -l)
echo "🗑️  Backups antiguos eliminados: $DELETED"

echo "✅ Backup completado"

# Mostrar espacio utilizado
echo ""
echo "📊 Espacio de backups:"
du -sh $BACKUP_DIR
echo ""
echo "📋 Últimos 5 backups:"
ls -lh $BACKUP_DIR/backup_*.tar.gz | tail -5
```

---

## 🔙 Script de Restauración

**Nombre:** `restore.sh`

**Uso:**
```bash
./restore.sh backup_20250110_120000.tar.gz
```

**Contenido:**
```bash
#!/bin/bash

#################################
# SCRIPT DE RESTAURACIÓN
# Magnolia Novedades
#################################

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

if [ -z "$1" ]; then
    log_error "Uso: ./restore.sh <archivo_backup>"
    echo ""
    echo "Backups disponibles:"
    ls -lh /home/deployer/app/backups/backup_*.tar.gz | awk '{print $9, "(" $5 ")"}'
    exit 1
fi

BACKUP_FILE="$1"
APP_DIR="/home/deployer/app"

if [ ! -f "$BACKUP_FILE" ]; then
    log_error "Archivo no encontrado: $BACKUP_FILE"
    exit 1
fi

log_info "=================================="
log_info "RESTAURANDO DESDE BACKUP"
log_info "=================================="
log_info "Archivo: $BACKUP_FILE"
log_info "Tamaño: $(du -h "$BACKUP_FILE" | cut -f1)"

read -p "¿Continuar? (s/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    log_warning "Operación cancelada"
    exit 1
fi

# Parar aplicación
log_info "Deteniendo aplicación..."
pm2 stop all 2>/dev/null || log_warning "No hay procesos activos"

# Restaurar
log_info "Restaurando archivos..."
tar -xzf "$BACKUP_FILE" -C / 2>/dev/null

if [ $? -eq 0 ]; then
    log_success "Archivos restaurados"
else
    log_error "Error al restaurar"
    exit 1
fi

# Reinstalar dependencias
log_info "Reinstalando dependencias..."
cd $APP_DIR/server
npm install --production

# Iniciar aplicación
log_info "Iniciando aplicación..."
cd $APP_DIR
pm2 start ecosystem.config.js --env production

log_info "=================================="
log_success "¡RESTAURACIÓN COMPLETADA!"
log_info "=================================="
pm2 status
```

---

## ⚙️ Instalación de Scripts

```bash
# Copiar scripts a VPS
scp initial-setup.sh deploy.sh monitor.sh backup.sh restore.sh deployer@TU_IP_VPS:/home/deployer/

# Conectar a VPS
ssh deployer@TU_IP_VPS

# Dar permisos de ejecución
chmod +x ~/*.sh

# Crear enlace simbólico en el PATH (opcional)
mkdir -p ~/bin
ln -s ~/deploy.sh ~/bin/
ln -s ~/monitor.sh ~/bin/
ln -s ~/backup.sh ~/bin/
```

---

## 📅 Crontab de Automatización

```bash
crontab -e

# Agregar las siguientes líneas:

# Backup diario a las 2 AM
0 2 * * * /home/deployer/backup.sh >> /home/deployer/app/logs/backup.log 2>&1

# Health check cada 5 minutos
*/5 * * * * curl -s https://localhost/api/health > /dev/null 2>&1 || echo "Health check failed at $(date)" >> /home/deployer/app/logs/health-check.log

# Actualizar certificados SSL cada mes
0 3 1 * * /usr/bin/certbot renew --quiet >> /home/deployer/app/logs/ssl-renewal.log 2>&1

# Limpiar logs cada semana
0 3 * * 0 find /home/deployer/app/logs -name "*.log" -mtime +30 -delete

# Reiniciar PM2 cada domingo a las 3 AM (para limpiar memoria)
0 3 * * 0 pm2 restart all >> /home/deployer/app/logs/restart.log 2>&1
```

---

**Última actualización:** 10 de enero de 2026

