# ⚡ Tarjeta de Referencia Rápida - Comandos VPS

**Magnolia Novedades - E-commerce WhatsApp**

---

## 🚀 Comandos de Inicio Rápido

### Conectar a VPS
```bash
ssh magnolia-vps
# O si no está en config:
ssh deployer@TU_IP_VPS
```

### Ver Status General
```bash
pm2 status                    # Estado de procesos
free -h                       # Memoria
df -h                         # Disco
top                           # CPU y recursos
```

### Ver Logs
```bash
pm2 logs                      # Todos los logs
pm2 logs --lines 50           # Últimas 50 líneas
pm2 logs ecommerce-api-1      # Un proceso específico
tail -f /var/log/nginx/error.log  # Errores Nginx
```

---

## 🔄 Comandos de Despliegue

### Actualizar desde GitHub
```bash
cd /home/deployer/app
git pull origin main
cd server
npm install --production
pm2 reload all
```

### Despliegue Automático
```bash
./deploy.sh
```

### Parar/Reiniciar
```bash
pm2 stop all                  # Parar
pm2 start all                 # Iniciar
pm2 restart all               # Reiniciar (con downtime)
pm2 reload all                # Reload (sin downtime)
pm2 delete all                # Eliminar de PM2
```

---

## 🔧 Comandos de Mantenimiento

### Limpiar Disco
```bash
# Logs antiguos (> 30 días)
find /home/deployer/app/logs -mtime +30 -delete

# Cache del sistema
sudo apt clean && sudo apt autoclean

# node_modules (reinstalará después)
rm -rf /home/deployer/app/server/node_modules
npm install --production
```

### Backup Manual
```bash
./backup.sh

# O manual:
tar -czf backup_$(date +%Y%m%d).tar.gz /home/deployer/app/server --exclude=node_modules
```

### Restaurar Backup
```bash
./restore.sh backup_20250110_120000.tar.gz
```

---

## 🔒 Comandos de Seguridad

### SSH sin Contraseña
```bash
# En máquina local:
ssh-copy-id -i ~/.ssh/id_rsa.pub deployer@IP

# Verificar:
ssh deployer@IP "echo OK"
```

### Firewall
```bash
# Ver status
sudo ufw status

# Permitir puertos
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Habilitar/Deshabilitar
sudo ufw enable
sudo ufw disable
```

### Ver Puertos Abiertos
```bash
sudo ss -tlnp                 # Puertos escuchando
sudo lsof -i :3001            # Específico
netstat -an | grep ESTABLISHED | wc -l  # Conexiones activas
```

---

## 📝 Comandos de Nginx

### Test Syntax
```bash
sudo nginx -t
```

### Recargar Configuración
```bash
sudo systemctl reload nginx
```

### Ver Status
```bash
sudo systemctl status nginx
sudo service nginx status
```

### Ver Logs
```bash
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Restart Completo
```bash
sudo systemctl restart nginx
```

---

## 🔐 Comandos de SSL/Certificados

### Ver Certificados
```bash
sudo certbot certificates
```

### Renovar Certificado
```bash
sudo certbot renew
sudo certbot renew --dry-run    # Test
sudo certbot renew --force-renewal  # Forzar
```

### Test de Certificado Online
```bash
openssl s_client -connect tudominio.com:443
# O desde navegador: https://www.ssllabs.com/ssltest/
```

---

## 📊 Comandos de Monitoreo

### Monitor en Vivo
```bash
pm2 monit                     # Dashboard
watch -n 5 'pm2 status'       # Actualizar cada 5s
pm2 web                       # Web dashboard (http://localhost:9615)
```

### Health Check Manual
```bash
curl -I https://tudominio.com/api/health
curl -I http://localhost:3001/api/health
```

### Monitoreo de Recursos
```bash
# CPU
ps aux --sort=-%cpu | head -10

# Memoria
ps aux --sort=-%mem | head -10

# Procesos Node.js
ps aux | grep node

# Ver cuota de disco
du -sh /home/deployer/app/*
```

---

## 🐛 Debugging Rápido

### Ver Qué Está Pasando
```bash
pm2 logs --timestamp          # Con fecha/hora
pm2 logs --raw                # Sin formateo
pm2 describe ecommerce-api-1  # Info detallada

# O directamente archivos:
tail -100 /home/deployer/app/logs/app-out-1.log
tail -100 /home/deployer/app/logs/app-error-1.log
```

### Buscar Errores
```bash
grep -i "error" /home/deployer/app/logs/*.log
grep "ERROR" /var/log/nginx/error.log
```

### Ver Estado de Base de Datos
```bash
# Probar conexión a Supabase
curl -X GET "https://TU_SUPABASE_URL/rest/v1/health" \
  -H "Authorization: Bearer TU_KEY"
```

---

## 🚨 Emergencias - Comandos Críticos

### API No Responde
```bash
# 1. Ver qué está pasando
pm2 logs

# 2. Reiniciar
pm2 restart all

# 3. Si sigue fallando, ver si está escuchando
sudo ss -tlnp | grep -E '3001|3002|3003'

# 4. Si no está, matar proceso huérfano
sudo fuser -k 3001/tcp

# 5. Restart completo
pm2 delete all
pm2 start ecosystem.config.js --env production
```

### Disco Lleno
```bash
# Ver qué ocupa espacio
du -sh /home/deployer/app/* | sort -h

# Liberar espacio
rm -rf /home/deployer/app/logs/*.log
find /home/deployer/app/backups -mtime +7 -delete

# Ver espacio
df -h
```

### Memoria Agotada
```bash
# Ver uso
free -h

# Restart gradual (sin downtime)
pm2 reload all

# O reiniciar todos
pm2 restart all
```

### Certificado SSL Expirado
```bash
# Ver estado
sudo certbot certificates

# Renovar
sudo certbot renew

# Si está en los logs, es automático, no preocuparte
```

---

## 📋 Tareas Programadas (Crontab)

### Ver trabajos cron
```bash
crontab -l
```

### Editar crontab
```bash
crontab -e
```

### Ejemplos de tareas
```bash
# Backup diario a las 2 AM
0 2 * * * /home/deployer/backup.sh

# Health check cada 5 minutos
*/5 * * * * curl -s https://tudominio.com/api/health > /dev/null

# Limpiar logs cada semana
0 3 * * 0 find /home/deployer/app/logs -mtime +30 -delete

# Actualización de SSL (automática, verificar)
0 3 1 * * /usr/bin/certbot renew --quiet
```

---

## 🔍 Búsqueda de Problemas

### Encontrar archivo o carpeta
```bash
find /home/deployer -name "*.log" -type f
find /home/deployer -size +100M -type f
```

### Buscar en archivos
```bash
grep -r "error" /home/deployer/app/logs/
grep -i "warning" /var/log/nginx/error.log
```

### Ver procesos
```bash
ps aux | grep node
ps aux | grep nginx
pgrep -f "node.*server"
```

---

## 🔗 Accesos Rápidos

### SSH Config (en ~/.ssh/config)
```bash
Host magnolia
    HostName tu.ip.vps
    User deployer
    IdentityFile ~/.ssh/id_rsa
```

**Uso:** `ssh magnolia`

### Alias de Comandos (en ~/.bashrc o ~/.zshrc)
```bash
alias vps='ssh magnolia-vps'
alias vps-logs='ssh magnolia-vps -c "pm2 logs"'
alias vps-status='ssh magnolia-vps -c "pm2 status"'
alias vps-backup='ssh magnolia-vps -c "./backup.sh"'
```

---

## 📐 Fórmulas Útiles

### Convertir Bytes a MB/GB
```bash
# En comando:
du -sh /path/to/folder

# Manual:
# bytes / 1024 / 1024 = MB
# bytes / 1024 / 1024 / 1024 = GB
```

### Uptime de Servidor
```bash
uptime
# Output: "14:30:45 up 45 days, 23:15, 2 users, load average: 0.12, 0.18, 0.25"
```

### Cálculo de Espacio en Disco
```bash
df -h | grep -E '/$'
# Muestra: Tamaño total, Usado, Libre, % Usado
```

---

## 🎯 Comandos por Situación

### "Quiero actualizar la app"
```bash
cd /home/deployer/app
git pull origin main
cd server && npm install --production && cd ..
pm2 reload all
pm2 logs --lines 20
```

### "Quiero ver si está todo bien"
```bash
pm2 status
free -h
df -h
curl -I https://tudominio.com/api/health
```

### "Backup ahora"
```bash
./backup.sh
# Verifica:
ls -lh /home/deployer/app/backups/
```

### "Revisar logs del error"
```bash
pm2 logs --timestamp | grep -i "error"
```

### "Reiniciar completamente"
```bash
pm2 delete all
pm2 start ecosystem.config.js --env production
pm2 logs
```

---

## 🔑 Archivos Importantes

| Archivo | Ubicación | Uso |
|---------|-----------|-----|
| .env | `/home/deployer/app/server/` | Variables de entorno |
| ecosystem.config.js | `/home/deployer/app/` | Config PM2 |
| nginx config | `/etc/nginx/sites-available/ecommerce-api` | Config web |
| Logs App | `/home/deployer/app/logs/` | Debugging |
| Logs Nginx | `/var/log/nginx/` | Web server debug |
| Backups | `/home/deployer/app/backups/` | Recuperación |
| SSH Keys | `~/.ssh/` | Acceso |

---

## 🆘 Cheat Sheet de Emergencia

```
┌─────────────────────────────────────────────┐
│ PROBLEMA → SOLUCIÓN (Copiar y pegar)       │
├─────────────────────────────────────────────┤
│ API No responde:                            │
│ pm2 logs && pm2 restart all                 │
│                                             │
│ Puerto en uso:                              │
│ sudo fuser -k 3001/tcp                      │
│                                             │
│ Sin espacio:                                │
│ rm /home/deployer/app/logs/*.log            │
│                                             │
│ Memory leak:                                │
│ pm2 monit                                   │
│                                             │
│ SSL error:                                  │
│ sudo certbot renew                          │
│                                             │
│ Nginx error:                                │
│ sudo nginx -t && sudo systemctl reload nginx│
│                                             │
│ Ver logs:                                   │
│ pm2 logs --lines 100                        │
│                                             │
│ Health check:                               │
│ curl https://tudominio.com/api/health       │
└─────────────────────────────────────────────┘
```

---

## 📱 Comandos Móbiles (Desde teléfono via SSH)

```bash
# Apps recomendadas: Termius, Paw, SSH Files

# Comandos que funcionan bien en móvil:
pm2 status                    # Rápido
free -h && df -h              # Rápido
pm2 logs --lines 10           # Legible en pantalla pequeña
curl https://tudominio.com/api/health  # Test rápido
```

---

## 🎓 Aprender Más

```bash
# Ayuda integrada
man nginx                     # Manual de Nginx
pm2 --help                    # Ayuda de PM2
node --help                   # Ayuda de Node.js

# Online
curl man.he.net/curl          # Manual de curl
# O visita: https://www.man7.org/
```

---

## ⚙️ Configuración Personalizada

Para tus scripts específicos:

```bash
# Crear script personalizado
cat > /home/deployer/bin/my-check.sh <<'EOF'
#!/bin/bash
echo "=== Mi Status Personalizado ==="
pm2 status
echo "Memoria:"
free -h
echo "Disco:"
df -h /
EOF

chmod +x /home/deployer/bin/my-check.sh

# Ejecutar:
./my-check.sh
```

---

**Actualizado:** 10 de enero de 2026  
**Versión:** 1.0  

**Tip:** Imprime o guarda esta tarjeta en tu teléfono para acceso rápido 📱

