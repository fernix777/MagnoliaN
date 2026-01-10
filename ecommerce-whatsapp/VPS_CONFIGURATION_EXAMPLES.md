# 📄 Archivos de Configuración Ejemplo
**Magnolia Novedades - E-commerce WhatsApp**

Este documento contiene ejemplos de archivos de configuración que necesitarás.

---

## 📝 Archivo 1: .env (Variables de Entorno)

**Ubicación:** `/home/deployer/app/server/.env`

**Permisos:** `chmod 600` (Solo lectura para propietario)

```env
# ========================================
# CONFIGURACIÓN DE PRODUCCIÓN
# ========================================

# Entorno
NODE_ENV=production
PORT=3000

# ========================================
# SUPABASE - BASE DE DATOS
# ========================================

# URL de tu proyecto Supabase (obtener de Settings > API)
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co

# Anon Key (público, seguro compartir)
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHh4eHh4eHgiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYyMzQ1NjAwMCwiZXhwIjoxNjI0MDYwODAwfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Service Role Key (privado, NUNCA compartir)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHh4eHh4eHgiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjIzNDU2MDAwLCJleHAiOjE2MjQwNjA4MDB9.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ========================================
# JWT - AUTENTICACIÓN
# ========================================

# Secreto para firmar JWT (generar con: openssl rand -base64 32)
JWT_SECRET=tu_secreto_jwt_super_seguro_aqui_minimo_32_caracteres_aleatorio1234567890!@

# Tiempo de expiración de tokens
JWT_EXPIRE=30d

# ========================================
# CORS - DOMINIOS PERMITIDOS
# ========================================

# Dominios que pueden hacer requests (separados por coma)
CORS_ORIGIN=https://tudominio.com,https://www.tudominio.com,http://localhost:5173

# ========================================
# RATE LIMITING
# ========================================

# Ventana de tiempo para rate limit
RATE_LIMIT_WINDOW=15m

# Máximo de requests por ventana
RATE_LIMIT_MAX_REQUESTS=100

# ========================================
# ARCHIVOS SUBIDOS
# ========================================

# Tamaño máximo de archivo en bytes (5MB = 5242880)
MAX_FILE_SIZE=5242880

# Directorio donde se guardan uploads
UPLOAD_DIR=/home/deployer/app/server/uploads

# ========================================
# LOGGING
# ========================================

# Nivel de log: error, warn, info, debug
LOG_LEVEL=info

# Archivo donde se guardan logs
LOG_FILE=/home/deployer/app/logs/app.log

# ========================================
# BACKUP AUTOMÁTICO (Opcional)
# ========================================

# Habilitar backups automáticos
BACKUP_ENABLED=true

# Intervalo de backup
BACKUP_INTERVAL=24h

# Días de retención de backups
BACKUP_RETENTION_DAYS=30

# ========================================
# EMAIL TRANSACCIONAL (Opcional)
# ========================================

# Si usas SendGrid
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@tudominio.com

# ========================================
# FACTURA / PAGOS (Opcional)
# ========================================

# Stripe (si vendés online)
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxx
STRIPE_PUBLIC_KEY=pk_live_xxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxx

# ========================================
# REDES SOCIALES (Opcional)
# ========================================

# Facebook API
FACEBOOK_PAGE_ID=1234567890
FACEBOOK_ACCESS_TOKEN=xxxxxxxxxxxxxxxx

# WhatsApp Business
WHATSAPP_BUSINESS_PHONE_ID=1234567890
WHATSAPP_BUSINESS_ACCESS_TOKEN=xxxxxxxxxxxxxxxx

# ========================================
# API EXTERNA (Opcional)
# ========================================

# Mapas / Ubicación
GOOGLE_MAPS_API_KEY=xxxxxxxxxxxxxxxx

# ========================================
# VARIABLES PERSONALIZADAS
# ========================================

# Tu nombre de empresa
COMPANY_NAME=Magnolia Novedades

# Email de soporte
SUPPORT_EMAIL=soporte@tudominio.com

# Teléfono de soporte
SUPPORT_PHONE=+54-XXXX-XXXXXX

# URL del sitio web
WEBSITE_URL=https://tudominio.com
```

---

## 🔧 Archivo 2: ecosystem.config.js (PM2 Config)

**Ubicación:** `/home/deployer/app/ecosystem.config.js`

```javascript
module.exports = {
  apps: [
    {
      // ===== APLICACIÓN 1 =====
      name: 'ecommerce-api-1',
      script: './server/src/server.js',
      cwd: '/home/deployer/app',
      instances: 1,
      exec_mode: 'fork',
      
      // Variables de entorno
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      
      // Logs
      error_file: '/home/deployer/app/logs/app-error-1.log',
      out_file: '/home/deployer/app/logs/app-out-1.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Reinicio automático
      watch: false,  // No observar cambios (es producción)
      ignore_watch: ['node_modules', 'logs', 'uploads'],
      
      // Memoria
      max_memory_restart: '1G',
      
      // Timeouts
      kill_timeout: 5000,
      listen_timeout: 10000,
    },
    
    {
      // ===== APLICACIÓN 2 =====
      name: 'ecommerce-api-2',
      script: './server/src/server.js',
      cwd: '/home/deployer/app',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3002
      },
      error_file: '/home/deployer/app/logs/app-error-2.log',
      out_file: '/home/deployer/app/logs/app-out-2.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      max_memory_restart: '1G',
      kill_timeout: 5000,
    },
    
    {
      // ===== APLICACIÓN 3 =====
      name: 'ecommerce-api-3',
      script: './server/src/server.js',
      cwd: '/home/deployer/app',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3003
      },
      error_file: '/home/deployer/app/logs/app-error-3.log',
      out_file: '/home/deployer/app/logs/app-out-3.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      max_memory_restart: '1G',
      kill_timeout: 5000,
    }
  ],

  // ===== DESPLIEGUE REMOTO (Opcional) =====
  deploy: {
    production: {
      user: 'deployer',
      host: 'TU_IP_VPS',  // Cambiar por tu IP
      ref: 'origin/main',
      repo: 'https://github.com/tuusuario/ecommerce-whatsapp.git',
      path: '/home/deployer/app',
      
      // Comandos pre y post deploy
      'pre-deploy-local': 'echo "🚀 Iniciando despliegue"',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-deploy': 'git pull'
    }
  }
};
```

---

## 🌐 Archivo 3: Configuración Nginx

**Ubicación:** `/etc/nginx/sites-available/ecommerce-api`

```nginx
# =========================================
# UPSTREAM - Define los procesos Node.js
# =========================================
upstream node_app {
    # Algoritmo de balanceo
    least_conn;  # Enviar al con menos conexiones
    
    # Procesos Node.js
    server localhost:3001 weight=1;
    server localhost:3002 weight=1;
    server localhost:3003 weight=1;
    
    # Configuración de conexión
    keepalive 64;
}

# =========================================
# SERVER - HTTP (Redirigir a HTTPS)
# =========================================
server {
    listen 80;
    listen [::]:80;
    
    server_name tudominio.com www.tudominio.com;
    
    # Validación de certificado Let's Encrypt
    location ~ /.well-known/acme-challenge {
        root /var/www/letsencrypt;
    }
    
    # Redirigir todo a HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# =========================================
# SERVER - HTTPS (Principal)
# =========================================
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    
    server_name tudominio.com www.tudominio.com;
    
    # ===== CERTIFICADO SSL =====
    ssl_certificate /etc/letsencrypt/live/tudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tudominio.com/privkey.pem;
    
    # ===== CONFIGURACIÓN SSL =====
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_session_tickets off;
    
    # HSTS (Fuerza HTTPS)
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # ===== HEADERS DE SEGURIDAD =====
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # ===== RATE LIMITING =====
    limit_req_zone $binary_remote_addr zone=general:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=api:10m rate=100r/m;
    limit_conn_zone $binary_remote_addr zone=addr:10m;
    limit_conn addr 10;
    
    # ===== COMPRESIÓN =====
    gzip on;
    gzip_types text/plain text/css text/xml text/javascript 
               application/x-javascript application/xml+rss 
               application/json application/javascript;
    gzip_min_length 1000;
    gzip_vary on;
    
    # ===== PROXY A NODE.JS =====
    location ~ ^/api/ {
        # Rate limiting para API
        limit_req zone=api burst=20 nodelay;
        
        # Proxy settings
        proxy_pass http://node_app;
        proxy_http_version 1.1;
        
        # Upgrade headers (para WebSocket, si es necesario)
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        
        # Headers importantes
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $server_name;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffering
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }
    
    # ===== HEALTH CHECK (Sin logs) =====
    location /api/health {
        proxy_pass http://node_app;
        access_log off;
    }
    
    # ===== ARCHIVOS ESTÁTICOS (UPLOADS) =====
    location /uploads/ {
        alias /home/deployer/app/server/uploads/;
        
        # Cache headers
        expires 30d;
        add_header Cache-Control "public, immutable";
        
        # Seguridad
        autoindex off;
    }
    
    # ===== ARCHIVOS ESTÁTICOS (PUBLICIDAD) =====
    location ~ ^/(robots\.txt|sitemap\.xml|feed\.xml) {
        alias /home/deployer/app/client/dist$request_uri;
        expires 24h;
        add_header Cache-Control "public";
    }
    
    # ===== DENEGAR ACCESO A ARCHIVOS SENSIBLES =====
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
    
    location ~ ~$ {
        deny all;
        access_log off;
        log_not_found off;
    }
    
    # ===== LOGS =====
    access_log /var/log/nginx/ecommerce-api-access.log combined;
    error_log /var/log/nginx/ecommerce-api-error.log warn;
    
    # ===== TAMAÑO MÁXIMO DE REQUEST =====
    client_max_body_size 5M;
    
    # ===== DIRECTORY LISTING =====
    autoindex off;
}

# ===== REDIRIGIR WWW A NO-WWW =====
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    
    server_name www.tudominio.com;
    
    ssl_certificate /etc/letsencrypt/live/tudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tudominio.com/privkey.pem;
    
    return 301 https://tudominio.com$request_uri;
}
```

---

## 🔐 Archivo 4: SSH Config (Acceso Rápido)

**Ubicación:** `~/.ssh/config` (En tu máquina local)

```
Host magnolia-vps
    HostName tu.ip.vps.aqui
    User deployer
    IdentityFile ~/.ssh/id_rsa
    Port 22
    StrictHostKeyChecking no
    UserKnownHostsFile=/dev/null
    LogLevel ERROR
    
    # Para túneles (si es necesario)
    # LocalForward 3306 localhost:5432
```

**Uso:**
```bash
# En lugar de: ssh deployer@IP
ssh magnolia-vps

# Copiar archivos fácilmente
scp archivo.txt magnolia-vps:/home/deployer/
```

---

## 📋 Archivo 5: .env.example (Plantilla)

**Ubicación:** `/home/deployer/app/server/.env.example`

```env
# Copia este archivo a .env y completa los valores
# cp .env.example .env

NODE_ENV=production
PORT=3000

SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_KEY=tu_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui

JWT_SECRET=tu_secreto_minimo_32_caracteres_aleatorios
JWT_EXPIRE=30d

CORS_ORIGIN=https://tudominio.com,https://www.tudominio.com

RATE_LIMIT_WINDOW=15m
RATE_LIMIT_MAX_REQUESTS=100

MAX_FILE_SIZE=5242880
UPLOAD_DIR=/home/deployer/app/server/uploads

LOG_LEVEL=info
LOG_FILE=/home/deployer/app/logs/app.log

BACKUP_ENABLED=true
BACKUP_INTERVAL=24h
BACKUP_RETENTION_DAYS=30
```

---

## 📜 Archivo 6: .htaccess (Si usas Apache)

**Ubicación:** `/home/deployer/app/server/.htaccess`

```apache
# Si alguna vez cambias de Nginx a Apache

RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.php [QSA,L]

# Comprimir
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript
</IfModule>

# Cache
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType text/html "access plus 1 hour"
  ExpiresByType image/jpeg "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 week"
</IfModule>

# Seguridad
<FilesMatch "^\.">
  Order allow,deny
  Deny from all
</FilesMatch>

<FilesMatch "\.(env|json|sql)$">
  Order allow,deny
  Deny from all
</FilesMatch>
```

---

## 🔑 Archivo 7: SSH Keys Setup

**En tu máquina local:**

```bash
# Generar clave (si no la tienes)
ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa -N ""

# Copiar clave pública a VPS
ssh-copy-id -i ~/.ssh/id_rsa.pub deployer@TU_IP_VPS

# Verificar
ssh deployer@TU_IP_VPS "echo 'SSH OK'"
```

**En la VPS:**

```bash
# Permisos correctos
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys

# Ver claves autorizadas
cat ~/.ssh/authorized_keys
```

---

## 📝 Archivo 8: Credentials Manager

**Ubicación:** `/home/deployer/.credentials` (Solo lectura)

```bash
#!/bin/bash
# Gestor de credenciales básico

CRED_FILE="$HOME/.magnolia-credentials"

# Crear archivo si no existe
if [ ! -f "$CRED_FILE" ]; then
    touch "$CRED_FILE"
    chmod 600 "$CRED_FILE"
fi

# Guardar credencial
save_cred() {
    echo "$1=$2" >> "$CRED_FILE"
    chmod 600 "$CRED_FILE"
}

# Obtener credencial
get_cred() {
    grep "^$1=" "$CRED_FILE" | cut -d= -f2
}

# Uso:
# save_cred "SUPABASE_URL" "https://xxxx.supabase.co"
# get_cred "SUPABASE_URL"
```

---

## 🚨 Checklist de Seguridad de Archivos

```bash
# Después de crear los archivos:

# 1. .env DEBE estar protegido
chmod 600 /home/deployer/app/server/.env
ls -la /home/deployer/app/server/.env
# Debe ser: -rw------- 1 deployer deployer

# 2. SSH keys protegidas
chmod 700 ~/.ssh
chmod 600 ~/.ssh/id_rsa
chmod 644 ~/.ssh/id_rsa.pub

# 3. Verificar no hay contraseñas en archivos
grep -r "password=" /home/deployer/app/  # No debe haber resultados
grep -r "secret=" /home/deployer/app/    # Solo en .env

# 4. Nginx config no expone secretos
cat /etc/nginx/sites-available/ecommerce-api | grep -i secret
# No debe haber resultados
```

---

## 🎯 Resumen de Configuración

| Archivo | Ubicación | Permisos | Crítico |
|---------|-----------|----------|---------|
| .env | `/home/deployer/app/server/` | 600 | ✅ SÍ |
| ecosystem.config.js | `/home/deployer/app/` | 644 | ✅ SÍ |
| nginx config | `/etc/nginx/sites-available/` | 644 | ✅ SÍ |
| SSH config | `~/.ssh/config` | 600 | ✅ SÍ |
| authorized_keys | `~/.ssh/authorized_keys` | 600 | ✅ SÍ |

---

**Actualizado:** 10 de enero de 2026

