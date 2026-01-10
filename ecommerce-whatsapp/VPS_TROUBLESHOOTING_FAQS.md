# 🆘 Troubleshooting y FAQs - Despliegue en VPS

**Magnolia Novedades - E-commerce WhatsApp**

---

## 📌 Tabla de Contenidos

1. [Problemas Comunes y Soluciones](#problemas-comunes-y-soluciones)
2. [Errores de Nginx](#errores-de-nginx)
3. [Errores de Node.js/PM2](#errores-de-nodejs--pm2)
4. [Errores de Certificado SSL](#errores-de-certificado-ssl)
5. [Problemas de Rendimiento](#problemas-de-rendimiento)
6. [Problemas de Base de Datos](#problemas-de-base-de-datos)
7. [FAQs Frecuentes](#faqs-frecuentes)
8. [Comandos Útiles de Debugging](#comandos-útiles-de-debugging)

---

## 🔴 Problemas Comunes y Soluciones

### Problema 1: "Connection refused" al acceder al sitio

**Síntomas:**
```
curl: (7) Failed to connect to localhost port 3000: Connection refused
```

**Causas posibles:**
1. La aplicación no está corriendo
2. El puerto está bloqueado por firewall
3. Nginx no está iniciado
4. Permiso insuficiente

**Soluciones (en orden):**

```bash
# 1. Verificar estado de la aplicación
pm2 status
pm2 logs

# 2. Si no hay procesos, iniciar
cd /home/deployer/app
pm2 start ecosystem.config.js --env production

# 3. Verificar que está escuchando en los puertos
sudo netstat -tlnp | grep -E '3001|3002|3003'
# O con ss (más moderno)
sudo ss -tlnp | grep -E '3001|3002|3003'

# 4. Verificar que Nginx está corriendo
sudo systemctl status nginx

# 5. Verificar logs de Nginx
sudo tail -50 /var/log/nginx/error.log

# 6. Probar conexión local
curl http://localhost:3001/api/health

# 7. Si nada funciona, reiniciar todo
sudo systemctl restart nginx
pm2 restart all
pm2 logs
```

**Verificación de puertos en uso:**
```bash
# Ver todos los puertos escuchando
sudo netstat -tlnp

# Ver proceso específico
ps aux | grep node
ps aux | grep nginx
```

---

### Problema 2: Error "502 Bad Gateway" en Nginx

**Síntomas:**
```
502 Bad Gateway
The upstream server is not responding
```

**Causas posibles:**
1. Procesos Node.js caídos
2. Aplicación crasheando
3. Memoria insuficiente
4. Timeout en proxy

**Soluciones:**

```bash
# 1. Revisar estado de procesos
pm2 status
pm2 logs ecommerce-api-1 --lines 50

# 2. Ver si hay crashes
pm2 info ecommerce-api-1

# 3. Revisar si está usando toda la memoria
free -h
ps aux --sort=-%mem | head -10

# 4. Si está lleno de memoria, limpiar
pm2 stop all
sleep 2
pm2 start ecosystem.config.js --env production

# 5. Ver logs de aplicación en detalle
pm2 logs --raw  # Sin formateo
pm2 logs --timestamp  # Con timestamps

# 6. Aumentar timeout en Nginx si es necesario
sudo nano /etc/nginx/sites-available/ecommerce-api
# Agregar:
# proxy_connect_timeout 60s;
# proxy_send_timeout 60s;
# proxy_read_timeout 60s;

sudo nginx -t
sudo systemctl reload nginx
```

---

### Problema 3: "EADDRINUSE: address already in use :::3001"

**Síntomas:**
```
Error: listen EADDRINUSE: address already in use :::3001
```

**Causas posibles:**
1. Ya hay un proceso en ese puerto
2. Proceso anterior no se cerró correctamente
3. PM2 no limpió bien

**Soluciones:**

```bash
# 1. Encontrar qué está usando el puerto
sudo lsof -i :3001
# O:
sudo ss -tlnp | grep 3001

# 2. Matar el proceso
sudo kill -9 PID

# 3. Limpiar PM2
pm2 delete all
pm2 status

# 4. Reiniciar
pm2 start ecosystem.config.js --env production

# 5. Usar fuser para matar por puerto
sudo fuser -k 3001/tcp

# 6. Si nada funciona, reiniciar la VPS
sudo reboot
```

---

### Problema 4: Error "ENOENT: no such file or directory"

**Síntomas:**
```
Error: ENOENT: no such file or directory, open '/path/to/file'
```

**Causas posibles:**
1. Archivo .env no existe o está mal ubicado
2. Ruta incorrecta en código
3. Permissions insuficientes
4. Archivo fue movido o eliminado

**Soluciones:**

```bash
# 1. Verificar que .env existe
ls -la /home/deployer/app/server/.env

# 2. Si no existe, crearlo
cp /home/deployer/app/server/.env.example /home/deployer/app/server/.env

# 3. Revisar permisos
chmod 600 /home/deployer/app/server/.env
chmod 644 /home/deployer/app/server/*.js

# 4. Verificar ownership
ls -la /home/deployer/app/server/

# 5. Si es problema de permisos
sudo chown -R deployer:deployer /home/deployer/app

# 6. Ver qué archivo está faltando en logs
pm2 logs | grep "no such file"
```

---

### Problema 5: "Cannot find module" error

**Síntomas:**
```
Cannot find module 'express'
```

**Causas posibles:**
1. Dependencias no instaladas
2. Node_modules corrupto
3. Versión de Node incompatible
4. Error en instalación

**Soluciones:**

```bash
# 1. Reinstalar todas las dependencias
cd /home/deployer/app/server
rm -rf node_modules package-lock.json
npm install --production

# 2. Verificar versión de Node
node --version  # Debe ser v20.x.x o similar

# 3. Verificar que package.json existe
cat package.json

# 4. Limpiar caché de npm
npm cache clean --force

# 5. Instalar con verbose para ver errores
npm install --verbose

# 6. Ver qué librerías están instaladas
npm list
```

---

## 🔸 Errores de Nginx

### Error: "nginx: [error] open() "/var/run/nginx.pid" failed"

**Causa:** Nginx no se inició correctamente

**Solución:**
```bash
sudo rm /var/run/nginx.pid
sudo systemctl restart nginx
sudo systemctl status nginx
```

---

### Error: "Address already in use" (puerto 80/443)

**Causa:** Otro servicio está usando el puerto

**Solución:**
```bash
# Encontrar qué está usando puerto 80
sudo lsof -i :80
sudo lsof -i :443

# Si es Apache
sudo systemctl stop apache2

# Si es otro Nginx
sudo systemctl stop nginx
sudo systemctl start nginx

# Último recurso
sudo fuser -k 80/tcp 443/tcp
```

---

### Error: "SSL: CERTIFICATE_VERIFY_FAILED"

**Causa:** Certificado SSL inválido o expirado

**Solución:**
```bash
# Verificar estado del certificado
sudo certbot certificates

# Renovar si es necesario
sudo certbot renew --force-renewal

# Verificar que Nginx está usando el certificado correcto
sudo nano /etc/nginx/sites-available/ecommerce-api
# Verificar rutas:
# ssl_certificate /etc/letsencrypt/live/DOMINIO/fullchain.pem;
# ssl_certificate_key /etc/letsencrypt/live/DOMINIO/privkey.pem;

sudo nginx -t
sudo systemctl reload nginx
```

---

## 🟣 Errores de Node.js / PM2

### Error: "JavaScript heap out of memory"

**Síntomas:** Aplicación se reinicia constantemente

**Causa:** Fuga de memoria en la aplicación

**Soluciones:**

```bash
# 1. Ver uso de memoria en tiempo real
pm2 monit

# 2. Ver logs en detalle
pm2 logs

# 3. Aumentar límite de memoria (temporal)
NODE_OPTIONS=--max-old-space-size=1024 pm2 start ecosystem.config.js --env production

# 4. Hacer permanente en ecosystem.config.js
node_args: "--max-old-space-size=1024"

# 5. Revisar código para memory leaks
# En package.json agregar script de análisis:
"analyze": "node --inspect app.js"

# 6. Usar clinic.js para profiling
npm install -g clinic
clinic doctor -- node src/server.js

# 7. Reiniciar procesos cada 24h (en ecosystem.config.js)
max_restarts: 10,
min_uptime: "10s",
cron_restart: "0 0 * * *"
```

---

### Error: "ECONNREFUSED: Connection refused" a Supabase

**Síntomas:** No puede conectar a base de datos

**Causa:** Variables de entorno incorrectas o Supabase no accesible

**Soluciones:**

```bash
# 1. Verificar variables de entorno
cat /home/deployer/app/server/.env | grep SUPABASE

# 2. Probar conexión a Supabase manualmente
curl -X POST "https://TU_SUPABASE_URL/auth/v1/signup" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password"}'

# 3. Verificar conectividad de red
ping supabase.co
ping TU_SUPABASE_URL

# 4. Revisar si hay firewall bloqueando HTTPS
sudo iptables -L -n | grep https

# 5. Reiniciar aplicación con las variables correctas
pm2 delete all
pm2 start ecosystem.config.js --env production

# 6. Ver qué variables se cargan en tiempo de ejecución
pm2 exec "console.log(process.env)" ecommerce-api-1
```

---

## 💛 Errores de Certificado SSL

### Error: "Certbot validation failed"

**Síntomas:**
```
Error creating new certificate
Couldn't find file /path/to/.well-known/acme-challenge/...
```

**Causa:** Nginx no está sirviendo los archivos de validación

**Soluciones:**

```bash
# 1. Asegurar que Nginx está corriendo
sudo systemctl status nginx

# 2. Crear directorio para validación
sudo mkdir -p /var/www/letsencrypt/.well-known/acme-challenge
sudo chown -R www-data:www-data /var/www/letsencrypt

# 3. Agregar bloque en Nginx
sudo nano /etc/nginx/sites-available/ecommerce-api
# Agregar ANTES del bloque SSL:
# location ~ /.well-known/acme-challenge {
#     root /var/www/letsencrypt;
# }

# 4. Recargar Nginx
sudo nginx -t
sudo systemctl reload nginx

# 5. Intentar generación de certificado nuevamente
sudo certbot certonly --webroot -w /var/www/letsencrypt -d tudominio.com

# 6. Si aún falla, usar método standalone (detiene Nginx)
sudo systemctl stop nginx
sudo certbot certonly --standalone -d tudominio.com
sudo systemctl start nginx
```

---

### Error: "Certificate expires in X days"

**Solución:**
```bash
# Renovar manualmente
sudo certbot renew --force-renewal

# Verificar renovación automática
sudo systemctl list-timers | grep certbot

# Ver próxima renovación
sudo certbot certificates
```

---

## 📊 Problemas de Rendimiento

### Problema: Aplicación muy lenta

**Diagnóstico:**

```bash
# 1. Ver uso de CPU
top -p $(pgrep -f "node.*server.js" | head -1)

# 2. Ver uso de memoria
ps aux --sort=-%mem | grep node | head -5

# 3. Ver tiempo de respuesta
curl -w "Tiempo: %{time_total}s\n" https://tudominio.com/api/health

# 4. Ver conexiones activas
netstat -an | grep ESTABLISHED | wc -l

# 5. Revisar logs de Nginx
tail -f /var/log/nginx/access.log | grep "POST\|GET"

# 6. Usar ab (Apache Bench) para test de carga
ab -c 10 -n 100 https://tudominio.com/api/health

# 7. Usar wrk para más estrés
wrk -t4 -c100 -d30s https://tudominio.com/api/health
```

**Soluciones:**

```bash
# 1. Optimizar Nginx (compresión gzip)
sudo nano /etc/nginx/nginx.conf
# Verificar:
# gzip on;
# gzip_types text/plain text/css application/json;
# gzip_min_length 1000;

# 2. Aumentar procesos Node.js
# En ecosystem.config.js, aumentar instances

# 3. Cachear respuestas
# Agregar headers de caché en Nginx
add_header Cache-Control "public, max-age=3600";

# 4. Usar CDN para archivos estáticos
# Cloudflare, Bunny CDN, etc.

# 5. Optimizar base de datos
# Ver índices en Supabase
# Verificar queries lentas
```

---

### Problema: Disco lleno

**Síntomas:**
```
No space left on device
```

**Diagnóstico:**

```bash
# Ver espacio en disco
df -h

# Ver carpetas más grandes
du -sh /home/deployer/app/*

# Ver archivos de log más grandes
du -sh /home/deployer/app/logs/*
ls -lSh /var/log/nginx/

# Encontrar archivos muy grandes
find /home/deployer -size +100M -type f
```

**Soluciones:**

```bash
# 1. Limpiar logs antiguos
find /home/deployer/app/logs -mtime +30 -delete

# 2. Comprimir logs antiguos
gzip /var/log/nginx/access.log.*

# 3. Eliminar node_modules y reinstalar
cd /home/deployer/app/server
rm -rf node_modules
npm install --production

# 4. Limpiar caché de sistema
sudo apt clean
sudo apt autoclean

# 5. Eliminar backups antiguos
find /home/deployer/app/backups -mtime +7 -delete

# 6. Ver si hay archivos sin usar
ncdu /home/deployer/app  # Instalar: sudo apt install ncdu
```

---

## 🗄️ Problemas de Base de Datos

### Error: "Connection to Supabase timeout"

**Soluciones:**

```bash
# 1. Verificar credenciales
cat /home/deployer/app/server/.env | grep SUPABASE

# 2. Probar conexión a Supabase
psql -h db.supabase.co -U postgres -d postgres

# 3. Revisar firewall de Supabase (Network Policies)
# Ir a Supabase Console > Settings > Network

# 4. Verificar si hay conexiones máximas
# Ver en Supabase: Settings > Database > Connections

# 5. Aumentar pool de conexiones en código
# En config/database.js
max_pool_size: 20

# 6. Reiniciar aplicación
pm2 restart all
```

---

### Error: "Too many connections"

**Causa:** Pool de conexiones agotado

**Soluciones:**

```bash
# 1. Ver conexiones activas
psql -h db.supabase.co -U postgres -d postgres -c "SELECT count(*) FROM pg_stat_activity;"

# 2. Matar conexiones ociosas
psql -h db.supabase.co -U postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'postgres' AND pid <> pg_backend_pid();"

# 3. En código, usar connection pooling
// En Supabase, ya viene con pgBouncer

# 4. Limitar conexiones en aplicación
const pool = new Pool({
  max: 10,
  min: 2,
  idle: 10000,
  connection: { timeout: 5000 }
});

# 5. Reducir procesos PM2 si es necesario
pm2 stop ecommerce-api-2
pm2 stop ecommerce-api-3
```

---

## ❓ FAQs Frecuentes

### P1: ¿Cómo reiniciar la aplicación sin downtime?

**Respuesta:**
```bash
# Con PM2 es muy simple - no hay downtime
pm2 reload all  # Recarga gradual (Cluster mode)

# O para una app específica
pm2 reload ecommerce-api-1

# Ver progreso
pm2 logs
```

---

### P2: ¿Cómo actualizar la aplicación desde GitHub?

**Respuesta:**
```bash
# Opción 1: Manualmente
cd /home/deployer/app
git pull origin main
cd server && npm install --production && cd ..
pm2 reload all

# Opción 2: Con script
./deploy.sh

# Opción 3: Con PM2 Deploy
pm2 deploy ecosystem.config.js production
```

---

### P3: ¿Cómo ver logs en tiempo real?

**Respuesta:**
```bash
# Ver todos los logs
pm2 logs

# Ver un proceso específico
pm2 logs ecommerce-api-1

# Con timestamps
pm2 logs --timestamp

# Últimas 50 líneas
pm2 logs --lines 50

# Guardar en archivo
pm2 logs > /home/deployer/logs/combined.log

# Ver logs de Nginx
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

---

### P4: ¿Cómo hacer backup de la base de datos?

**Respuesta:**
```bash
# Backup desde Supabase (recomendado - lo hace automáticamente)
# Ver en Supabase Console > Settings > Backup

# O hacer backup manual del código
./backup.sh

# Backup de solo la base de datos
pg_dump -h db.supabase.co -U postgres database_name > backup.sql

# Restaurar desde backup
psql -h db.supabase.co -U postgres database_name < backup.sql
```

---

### P5: ¿Cómo monitorear en tiempo real?

**Respuesta:**
```bash
# Dashboard PM2
pm2 web
# Acceso en http://localhost:9615

# Monitor de recursos
pm2 monit

# Para sistemas remotos, instalar PM2+
pm2 install pm2-auto-pull
pm2 install pm2-logrotate

# Script de monitoreo personalizado
./monitor.sh
```

---

### P6: ¿Cómo escalar a más usuarios?

**Respuesta:**

**Corto plazo (Sin cambiar VPS):**
```bash
# Aumentar procesos Node.js en ecosystem.config.js
"instances": 4  # De 3 a 4
pm2 reload all

# Habilitar caché con Redis
npm install redis
# Ver documentación de Redis

# Optimizar Nginx (gzip, cache headers)
```

**Largo plazo:**
```bash
# Migrar a VPS más grande
# Usar load balancer (HAProxy, Nginx en otra VPS)
# Separar base de datos (PostgreSQL dedicado)
# Usar CDN (Cloudflare, Bunny CDN)
# Microservicios o serverless (AWS Lambda, Azure Functions)
```

---

### P7: ¿Cómo configurar alertas de downtime?

**Respuesta:**
```bash
# Opción 1: Con PM2 Pro
pm2 plus
# Ver en https://pm2.io/

# Opción 2: Con Uptime Robot
# https://uptimerobot.com
# Crear monitor para https://tudominio.com/api/health

# Opción 3: Script personalizado con webhook
cat > /home/deployer/app/alert.sh <<'EOF'
#!/bin/bash
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://tudominio.com/api/health)
if [ "$RESPONSE" != "200" ]; then
  curl -X POST https://hooks.slack.com/services/YOUR/WEBHOOK/URL \
    -d '{"text":"API está down!"}'
fi
EOF

chmod +x /home/deployer/app/alert.sh

# Añadir a crontab (cada 5 minutos)
*/5 * * * * /home/deployer/app/alert.sh
```

---

### P8: ¿Es segura mi aplicación?

**Checklist de seguridad:**
```bash
# 1. Verificar firewall
sudo ufw status

# 2. Verificar SSH keys (no contraseña)
cat ~/.ssh/authorized_keys

# 3. Verificar que root está deshabilitado
sudo grep "PermitRootLogin" /etc/ssh/sshd_config

# 4. Verificar certificado SSL
openssl s_client -connect tudominio.com:443

# 5. Test de seguridad SSL
curl -I https://tudominio.com

# 6. Ver qué puertos están abiertos
sudo ss -tlnp

# 7. Revisar fail2ban
sudo fail2ban-client status

# 8. Update de dependencias
npm audit
npm audit fix
```

---

### P9: ¿Cómo debuggear la aplicación?

**Respuesta:**
```bash
# Modo debug en Node.js
node --inspect src/server.js
# Chrome DevTools: chrome://inspect

# Con PM2
pm2 start ecosystem.config.js --update-env --node-args="--inspect"

# Añadir console.logs
// En tu código
console.log('DEBUG:', variable);

// Ver en logs
pm2 logs | grep DEBUG

# Usar debugger
// En código
debugger;

# Environment de desarrollo
NODE_ENV=development pm2 start ecosystem.config.js
```

---

### P10: ¿Cómo se ve el invoice mensual?

**Respuesta - Ejemplo de costos:**

**Opción 1: DigitalOcean ($12/mes)**
```
VPS Droplet (2GB, 1 vCore): $12/mes
Backups automáticos (opcional): +$3/mes
Total: ~$15/mes
```

**Opción 2: Hetzner (€7/mes)**
```
VPS Cloud (4GB, 2 vCore): €7/mes = ~$7.60
Backup Volume (40GB): €1-2/mes
Total: ~€8-9/mes = ~$8.70-10/mes ← MÁS BARATO
```

**Costos adicionales:**
```
Dominio .com: $10-15/año
Certificado SSL: $0 (Let's Encrypt)
Supabase: $0-5/mes (según uso)
Email transaccional: $0-20/mes (opcional)
CDN: $0-10/mes (opcional)
```

**Total estimado: $20-35/mes** ✅

---

## 🛠️ Comandos Útiles de Debugging

```bash
# INFORMACIÓN DEL SISTEMA
uname -a                              # Info del SO
lsb_release -a                        # Versión Ubuntu
uptime                                # Tiempo encendido
whoami                                # Usuario actual
hostname                              # Nombre del servidor

# RECURSOS
free -h                               # Memoria
df -h                                 # Disco
top -b -n 1 | head -20                # Procesos
htop                                  # Monitor interactivo
vmstat 1 5                            # Estadísticas VM

# RED
ifconfig                              # Interfaces de red
netstat -tlnp                         # Puertos abiertos
ss -tlnp                              # Puertos (moderno)
curl -I https://tudominio.com         # Headers HTTP
nslookup tudominio.com                # DNS lookup
ping google.com                       # Conectividad

# PROCESOS NODE.JS
ps aux | grep node                    # Listar procesos
ps aux --sort=-%cpu | head -10        # Ordenar por CPU
ps aux --sort=-%mem | head -10        # Ordenar por RAM
pgrep -f "node.*server"               # PID de server.js

# PM2
pm2 status                            # Estado
pm2 logs                              # Logs
pm2 logs --lines 100                  # Últimas 100 líneas
pm2 monit                             # Monitor
pm2 info ecommerce-api-1              # Info detallada
pm2 describe all                      # Todos los detalles

# NGINX
sudo nginx -t                         # Test de sintaxis
sudo systemctl status nginx           # Estado
sudo systemctl restart nginx          # Reiniciar
sudo tail -50 /var/log/nginx/error.log  # Ver errores
sudo tail -f /var/log/nginx/access.log  # Ver accesos en tiempo real

# SSL/TLS
sudo certbot certificates             # Ver certificados
openssl s_client -connect tudominio.com:443  # Verificar certificado
sudo certbot renew --dry-run          # Test de renovación

# FIREWALL
sudo ufw status                       # Estado
sudo ufw allow 22/tcp                 # Permitir SSH
sudo ufw delete allow 22/tcp          # Denegar SSH

# LOGS DEL SISTEMA
tail -50 /var/log/syslog              # Logs del sistema
journalctl -u nginx -n 50             # Logs de nginx (systemd)
journalctl -f                         # Logs en tiempo real

# GIT
git status                            # Estado
git log --oneline -10                 # Últimos 10 commits
git diff                              # Cambios no staged
git pull                              # Actualizar código

# BACKUP/RESTORE
tar -czf backup.tar.gz /home/deployer/app   # Crear backup
tar -xzf backup.tar.gz                       # Restaurar backup
du -sh /home/deployer/app                    # Tamaño carpeta

# MONITOREO CONTINUO
watch -n 5 'pm2 status'               # Actualizar cada 5 segundos
watch -n 1 'free -h'                  # Ver memoria en tiempo real
watch -n 2 'df -h'                    # Ver disco en tiempo real
```

---

**Última actualización:** 10 de enero de 2026  
**Versión:** 1.0

