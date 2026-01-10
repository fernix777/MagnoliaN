# 📋 Plan de Despliegue Backend en VPS
**Magnolia Novedades - E-commerce WhatsApp**

**Fecha:** 10 de enero de 2026  
**Versión:** 1.0

---

## 📊 Contenido del Plan

1. [Especificaciones de la VPS](#especificaciones-de-la-vps)
2. [Arquitectura del Despliegue](#arquitectura-del-despliegue)
3. [Preparación Previa](#preparación-previa)
4. [Instalación y Configuración](#instalación-y-configuración)
5. [Monitoreo y Mantenimiento](#monitoreo-y-mantenimiento)
6. [Seguridad](#seguridad)
7. [Rollback y Contingencia](#rollback-y-contingencia)
8. [Costos Estimados](#costos-estimados)

---

## 🖥️ Especificaciones de la VPS

### Recomendación: VPS Mediana (Entrada)

| Recurso | Mínimo | Recomendado | Máximo |
|---------|--------|-------------|--------|
| **CPU** | 1 vCore | 2 vCores | 4 vCores |
| **RAM** | 1 GB | 2 GB | 4 GB |
| **Almacenamiento** | 20 GB SSD | 40 GB SSD | 100 GB SSD |
| **Ancho de Banda** | 1 TB/mes | 2 TB/mes | 5 TB/mes |
| **Usuarios Concurrentes** | ~100 | ~500 | ~1000+ |

### Configuración Recomendada (Inicial)
```
💾 OS: Ubuntu 22.04 LTS (64-bit)
🖥️  CPU: 2 vCores
🧠 RAM: 2 GB
📦 Disco: 40 GB SSD
🌐 IPv4: 1 dirección pública
🔒 Firewall: Incluido
```

### Proveedores Sugeridos
- **DigitalOcean**: $12-18 USD/mes
- **Linode**: $12-24 USD/mes
- **Vultr**: $12-18 USD/mes
- **AWS Lightsail**: $12-24 USD/mes
- **Hetzner**: €5-10/mes (excelente relación precio-rendimiento)

---

## 🏗️ Arquitectura del Despliegue

```
┌─────────────────────────────────────────────────────────────┐
│                         INTERNET                             │
└──────────────────────────┬──────────────────────────────────┘
                           │
                    ┌──────▼─────────┐
                    │  Nginx/Apache  │ (Reverse Proxy)
                    │  Puerto 80/443 │
                    └──────┬─────────┘
                           │
            ┌──────────────┼──────────────┐
            │              │              │
       ┌────▼───┐    ┌────▼───┐    ┌────▼───┐
       │ Node.js│    │ Node.js│    │ Node.js│
       │Proceso1│    │Proceso2│    │Proceso3│ (PM2 Cluster)
       │:3001   │    │:3002   │    │:3003   │
       └────┬───┘    └────┬───┘    └────┬───┘
            │              │              │
            └──────────────┼──────────────┘
                           │
                    ┌──────▼─────────┐
                    │   Supabase     │
                    │  (PostgreSQL)  │
                    └────────────────┘
```

---

## 🔧 Preparación Previa

### Checklist Previo
- [ ] Contratar VPS y obtener acceso SSH
- [ ] Registrar/verificar dominio
- [ ] Generar certificado SSL (Let's Encrypt)
- [ ] Preparar variables de entorno
- [ ] Crear cuenta en Supabase (si no existe)
- [ ] Backup de base de datos local

### Información Requerida
```
Variables de Entorno Necesarias:
✅ SUPABASE_URL
✅ SUPABASE_KEY
✅ SUPABASE_SERVICE_ROLE_KEY
✅ PORT (default: 3000)
✅ NODE_ENV (production)
✅ JWT_SECRET
✅ JWT_EXPIRE (30d)
```

---

## 🚀 Instalación y Configuración

### Fase 1: Preparación del Sistema (15-20 minutos)

#### 1.1 Conectar a la VPS
```bash
ssh root@TU_IP_VPS
```

#### 1.2 Actualizar el Sistema
```bash
apt update && apt upgrade -y
apt install -y curl wget git nano htop
```

#### 1.3 Crear Usuario No-Root
```bash
adduser deployer
usermod -aG sudo deployer
su - deployer
```

#### 1.4 Configurar SSH sin Contraseña (local)
```bash
# Desde tu máquina local
ssh-copy-id -i ~/.ssh/id_rsa.pub deployer@TU_IP_VPS

# Verificar
ssh deployer@TU_IP_VPS "echo 'SSH OK'"
```

---

### Fase 2: Instalación de Node.js y npm (10-15 minutos)

#### 2.1 Instalar Node.js (v20 LTS)
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar instalación
node --version  # v20.x.x
npm --version   # 10.x.x
```

#### 2.2 Instalar PM2 (Gestor de Procesos)
```bash
sudo npm install -g pm2

# Completar instalación
pm2 startup
pm2 save

# Verificar
pm2 status
```

---

### Fase 3: Configuración de Nginx (15 minutos)

#### 3.1 Instalar Nginx
```bash
sudo apt install -y nginx

# Iniciar y habilitar
sudo systemctl start nginx
sudo systemctl enable nginx

# Verificar
sudo systemctl status nginx
```

#### 3.2 Crear Configuración del Sitio
```bash
sudo nano /etc/nginx/sites-available/ecommerce-api
```

**Contenido:**
```nginx
upstream node_app {
    least_conn;
    server localhost:3001;
    server localhost:3002;
    server localhost:3003;
}

server {
    listen 80;
    server_name tudominio.com www.tudominio.com;

    # Redireccionar HTTP a HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name tudominio.com www.tudominio.com;

    # Certificados SSL
    ssl_certificate /etc/letsencrypt/live/tudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tudominio.com/privkey.pem;

    # Seguridad SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Headers de seguridad
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Límite de velocidad
    limit_req_zone $binary_remote_addr zone=general:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=api:10m rate=100r/m;
    
    location ~ ^/api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://node_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check
    location /api/health {
        proxy_pass http://node_app;
        access_log off;
    }

    # Archivos estáticos (uploads)
    location /uploads/ {
        alias /home/deployer/app/server/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    gzip_min_length 1000;

    # Logs
    access_log /var/log/nginx/ecommerce-api-access.log combined;
    error_log /var/log/nginx/ecommerce-api-error.log warn;
}
```

#### 3.3 Activar la Configuración
```bash
# Verificar sintaxis
sudo nginx -t

# Crear enlace simbólico
sudo ln -s /etc/nginx/sites-available/ecommerce-api /etc/nginx/sites-enabled/

# Recargar Nginx
sudo systemctl reload nginx
```

---

### Fase 4: Certificado SSL Let's Encrypt (10 minutos)

#### 4.1 Instalar Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx

# Generar certificado
sudo certbot certonly --nginx -d tudominio.com -d www.tudominio.com

# Verificar
sudo ls -la /etc/letsencrypt/live/tudominio.com/
```

#### 4.2 Renovación Automática
```bash
# Crear script de renovación
sudo tee /usr/local/bin/renew-certs.sh > /dev/null <<EOF
#!/bin/bash
certbot renew --quiet && systemctl reload nginx
EOF

sudo chmod +x /usr/local/bin/renew-certs.sh

# Añadir a crontab
sudo crontab -e

# Agregar línea:
# 0 3 * * * /usr/local/bin/renew-certs.sh
```

---

### Fase 5: Clonar y Configurar Aplicación (15 minutos)

#### 5.1 Preparar Directorio
```bash
mkdir -p /home/deployer/app
cd /home/deployer/app

# Crear estructura
mkdir -p backups logs
```

#### 5.2 Clonar Repositorio
```bash
# Si tienes GitHub
git clone https://github.com/tuusuario/ecommerce-whatsapp.git .
git config user.email "deploy@tudominio.com"
git config user.name "Deploy Bot"

# O copiar archivos directamente
scp -r ./server/* deployer@TU_IP_VPS:/home/deployer/app/server/
```

#### 5.3 Instalar Dependencias Backend
```bash
cd /home/deployer/app/server
npm install --production

# Generar lista de dependencias
npm list > /home/deployer/app/logs/dependencies.txt
```

#### 5.4 Crear Archivo .env
```bash
nano /home/deployer/app/server/.env
```

**Contenido:**
```env
# === CONFIGURACIÓN DE PRODUCCIÓN ===
NODE_ENV=production
PORT=3000

# === SUPABASE ===
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# === JWT ===
JWT_SECRET=tu_secreto_jwt_super_seguro_aqui_minimo_32_caracteres
JWT_EXPIRE=30d

# === LOGGING ===
LOG_LEVEL=info
LOG_FILE=/home/deployer/app/logs/app.log

# === CORS ===
CORS_ORIGIN=https://tudominio.com,https://www.tudominio.com

# === RATE LIMITING ===
RATE_LIMIT_WINDOW=15m
RATE_LIMIT_MAX_REQUESTS=100

# === UPLOAD ===
MAX_FILE_SIZE=5242880
UPLOAD_DIR=/home/deployer/app/server/uploads

# === BACKUP ===
BACKUP_ENABLED=true
BACKUP_INTERVAL=24h
BACKUP_RETENTION_DAYS=30
```

⚠️ **IMPORTANTE:** Guardar con permisos restringidos:
```bash
chmod 600 /home/deployer/app/server/.env
```

---

### Fase 6: Configurar PM2 (10 minutos)

#### 6.1 Crear Archivo de Configuración PM2
```bash
nano /home/deployer/app/ecosystem.config.js
```

**Contenido:**
```javascript
module.exports = {
  apps: [
    {
      name: 'ecommerce-api-1',
      script: './server/src/server.js',
      cwd: '/home/deployer/app',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: '/home/deployer/app/logs/app-error-1.log',
      out_file: '/home/deployer/app/logs/app-out-1.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    },
    {
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
      merge_logs: true
    },
    {
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
      merge_logs: true
    }
  ],
  deploy: {
    production: {
      user: 'deployer',
      host: 'TU_IP_VPS',
      ref: 'origin/main',
      repo: 'https://github.com/tuusuario/ecommerce-whatsapp.git',
      path: '/home/deployer/app',
      'pre-deploy-local': 'echo "Iniciando despliegue"',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-deploy': 'git pull'
    }
  }
};
```

#### 6.2 Iniciar Aplicación con PM2
```bash
cd /home/deployer/app

# Iniciar procesos
pm2 start ecosystem.config.js --env production

# Verificar estado
pm2 status
pm2 logs

# Salvar configuración
pm2 save

# Habilitar arranque automático
pm2 startup systemd -u deployer --hp /home/deployer
```

---

### Fase 7: Firewall y Seguridad (10 minutos)

#### 7.1 Configurar UFW (Uncomplicated Firewall)
```bash
# Habilitar firewall
sudo ufw enable

# Permitir puertos
sudo ufw allow 22/tcp       # SSH
sudo ufw allow 80/tcp       # HTTP
sudo ufw allow 443/tcp      # HTTPS

# Bloquear todo lo demás por defecto
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Verificar reglas
sudo ufw status
```

#### 7.2 Configurar Fail2Ban (Protección contra Ataques)
```bash
# Instalar
sudo apt install -y fail2ban

# Crear configuración local
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo nano /etc/fail2ban/jail.local
```

**Agregar al archivo:**
```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true

[nginx-http-auth]
enabled = true

[nginx-limit-req]
enabled = true

[nginx-noscript]
enabled = true
```

```bash
# Iniciar servicio
sudo systemctl start fail2ban
sudo systemctl enable fail2ban
sudo systemctl status fail2ban
```

#### 7.3 Actualizar Contraseña Root
```bash
sudo passwd root
```

---

### Fase 8: Monitoreo y Logging (10 minutos)

#### 8.1 Crear Script de Health Check
```bash
cat > /home/deployer/app/health-check.sh <<'EOF'
#!/bin/bash

API_URL="https://tudominio.com/api/health"
LOG_FILE="/home/deployer/app/logs/health-check.log"

RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $API_URL)
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

if [ "$RESPONSE" != "200" ]; then
    echo "[$TIMESTAMP] ❌ HEALTH CHECK FAILED (Code: $RESPONSE)" >> $LOG_FILE
    # Opcional: Reiniciar PM2
    # pm2 restart all
else
    echo "[$TIMESTAMP] ✅ HEALTH CHECK OK" >> $LOG_FILE
fi
EOF

chmod +x /home/deployer/app/health-check.sh
```

#### 8.2 Añadir Health Check a Crontab
```bash
crontab -e

# Agregar línea (ejecutar cada 5 minutos):
*/5 * * * * /home/deployer/app/health-check.sh
```

#### 8.3 Configurar Rotación de Logs
```bash
sudo nano /etc/logrotate.d/ecommerce-api
```

**Contenido:**
```
/home/deployer/app/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    missingok
    create 0640 deployer deployer
    sharedscripts
    postrotate
        pm2 reloadLogs > /dev/null 2>&1 || true
    endscript
}
```

---

## 📊 Monitoreo y Mantenimiento

### Comandos Básicos PM2
```bash
# Ver estado
pm2 status
pm2 monit

# Ver logs en tiempo real
pm2 logs app-name

# Reiniciar
pm2 restart all

# Parar
pm2 stop all

# Eliminar
pm2 delete all

# Guardar lista de procesos
pm2 save
```

### Monitoreo de Recursos
```bash
# Instalación de PM2+
pm2 install pm2-logrotate

# Dashboard web
pm2 web  # Acceso en http://localhost:9615

# Espacio en disco
df -h

# Uso de memoria
free -h

# Procesos activos
top
htop
```

### Backups Automáticos
```bash
cat > /home/deployer/app/backup.sh <<'EOF'
#!/bin/bash

BACKUP_DIR="/home/deployer/app/backups"
DATE=$(date '+%Y%m%d_%H%M%S')
SOURCE="/home/deployer/app/server"

# Crear backup
tar -czf $BACKUP_DIR/backup_$DATE.tar.gz $SOURCE --exclude=node_modules --exclude=uploads

# Eliminar backups antiguos (> 7 días)
find $BACKUP_DIR -name "backup_*.tar.gz" -mtime +7 -delete

echo "Backup completado: backup_$DATE.tar.gz"
EOF

chmod +x /home/deployer/app/backup.sh

# Ejecutar diariamente a las 2 AM
crontab -e
# 0 2 * * * /home/deployer/app/backup.sh
```

---

## 🔒 Seguridad

### Checklist de Seguridad
- [ ] Cambiar contraseña root
- [ ] Configurar SSH sin contraseña
- [ ] Deshabilitar login de root por SSH
- [ ] Habilitar UFW firewall
- [ ] Instalar Fail2Ban
- [ ] Certificado SSL activo
- [ ] Variables de entorno protegidas
- [ ] Realizar backup regular
- [ ] Monitoreo de logs
- [ ] Actualizar sistema regularmente

### Hardening Adicional
```bash
# Deshabilitar login root por SSH
sudo nano /etc/ssh/sshd_config
# PermitRootLogin no
# PasswordAuthentication no
# PubkeyAuthentication yes

sudo systemctl restart sshd

# Configurar límite de archivos abiertos
sudo nano /etc/security/limits.conf
# deployer soft nofile 65536
# deployer hard nofile 65536

# Habilitar módulos de seguridad Nginx
sudo nano /etc/nginx/nginx.conf
# Descomentar: include /etc/nginx/modules-enabled/*;
```

---

## 🔄 Rollback y Contingencia

### Plan de Rollback
```bash
# Si algo sale mal, volver a versión anterior

# 1. Detener aplicación
pm2 stop all

# 2. Restaurar desde backup
cd /home/deployer/app
tar -xzf backups/backup_FECHA.tar.gz

# 3. Reinstalar dependencias
cd server
npm install --production

# 4. Reiniciar
pm2 start ecosystem.config.js --env production
```

### Monitoreo de Errores
```bash
# Ver últimos errores
pm2 logs --lines 100

# Ver errores específicos
tail -f /home/deployer/app/logs/app-error-1.log

# Buscar patrones de error
grep -i "error" /home/deployer/app/logs/*.log
```

---

## 💰 Costos Estimados (Mensual)

| Servicio | Costo | Notas |
|----------|-------|-------|
| **VPS Mediana** | $12-18 | 2 vCores, 2GB RAM, 40GB SSD |
| **Dominio** | $10-15 | .com, .es, etc. |
| **Supabase** | $5-25 | Según uso (gratuito hasta 500MB) |
| **Certificado SSL** | $0 | Let's Encrypt (gratuito) |
| **Correos Transaccionales** | $5-20 | SendGrid, MailChimp, etc. (opcional) |
| **Backups Cloud** | $5-10 | S3, Backblaze, etc. (opcional) |
| **TOTAL MÍNIMO** | ~$32-48 | Entrada |
| **TOTAL RECOMENDADO** | ~$50-80 | Con todos los servicios |

---

## 📈 Escalabilidad Futura

### Cuando Crezcas
1. **Más Recursos en VPS**: 4 vCores, 4GB RAM, 100GB SSD
2. **Base de Datos Separada**: PostgreSQL dedicada
3. **CDN**: CloudFlare, Bunny CDN para archivos estáticos
4. **Load Balancer**: Distribuir carga entre múltiples VPS
5. **Cache**: Redis para sesiones y caché
6. **Microservicios**: Separar en servicios independientes

---

## ✅ Checklist Final

### Pre-Despliegue
- [ ] VPS contratada y accesible
- [ ] Dominio registrado y DNS configurado
- [ ] Variables de entorno preparadas
- [ ] Backup de datos locales
- [ ] Certificado SSL listo

### Durante Despliegue
- [ ] Sistema actualizado
- [ ] Node.js 20 LTS instalado
- [ ] PM2 configurado
- [ ] Nginx funcionando
- [ ] SSL activo
- [ ] Aplicación iniciada
- [ ] Health check pasando

### Post-Despliegue
- [ ] API respondiendo en HTTPS
- [ ] Logs monitoreados
- [ ] Backups automáticos activos
- [ ] Firewall habilitado
- [ ] Health check funcionando
- [ ] Alertas configuradas

---

## 🆘 Troubleshooting

### Problema: "Port 3000 already in use"
```bash
lsof -i :3000
kill -9 PID
```

### Problema: "Permission denied"
```bash
sudo chown -R deployer:deployer /home/deployer/app
chmod -R 755 /home/deployer/app
```

### Problema: "SSL certificate not found"
```bash
sudo certbot certonly --standalone -d tudominio.com
```

### Problema: "Nginx not loading"
```bash
sudo nginx -t  # Test syntax
sudo systemctl restart nginx
tail -f /var/log/nginx/error.log
```

### Problema: "PM2 processes crashing"
```bash
pm2 logs
pm2 monit
pm2 delete all
pm2 start ecosystem.config.js --env production
```

---

## 📞 Contacto y Soporte

**En caso de problemas:**
- Revisar logs: `pm2 logs`
- Verificar estado: `pm2 status`
- Health check: `curl https://tudominio.com/api/health`
- SSH a VPS: `ssh deployer@TU_IP_VPS`

---

**Documento preparado el:** 10 de enero de 2026  
**Versión:** 1.0  
**Próxima revisión:** Octubre 2026

