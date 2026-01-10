# 🚀 RESUMEN EJECUTIVO - Plan de Despliegue Backend en VPS
**Magnolia Novedades E-commerce**

---

## 📌 Información Rápida

| Aspecto | Especificación |
|--------|-----------------|
| **Tamaño de VPS Recomendado** | 2 vCores, 2GB RAM, 40GB SSD |
| **Sistema Operativo** | Ubuntu 22.04 LTS |
| **Stack Backend** | Node.js 20 LTS + Express |
| **Gestor de Procesos** | PM2 (3 instancias) |
| **Servidor Web** | Nginx (Reverse Proxy) |
| **Base de Datos** | Supabase PostgreSQL |
| **Certificado SSL** | Let's Encrypt (Gratuito) |
| **Costo Aproximado** | $12-20 USD/mes |
| **Tiempo de Instalación** | 2-3 horas |
| **Uptime Esperado** | 99.9% |

---

## 💰 Presupuesto Mensual Estimado

```
VPS (2GB RAM, 2 vCores, 40GB SSD):    $12-18  USD
Dominio (.com, .es):                   ~$1    USD
Supabase (gratuito hasta 500MB):       $0     USD
Certificado SSL (Let's Encrypt):       $0     USD
Email transaccional (opcional):        $5-20  USD
CDN (opcional):                        $0-10  USD
────────────────────────────────────────────────
TOTAL MÍNIMO:                          $12-19 USD/mes
TOTAL RECOMENDADO:                     $30-50 USD/mes
```

---

## 🎯 Proveedores Recomendados (Ranking)

### 🥇 1. Hetzner (MEJOR PRECIO)
- **Precio**: €7/mes (~$7.60)
- **Specs**: 2 vCores, 4GB RAM, 40GB SSD
- **Perfecto para**: Budget consciente
- **Link**: https://www.hetzner.com/cloud

### 🥈 2. DigitalOcean (MEJOR BALANCE)
- **Precio**: $12/mes
- **Specs**: 1-2 vCores, 2GB RAM, 50GB SSD
- **Perfecto para**: Emprendedores, startups
- **Link**: https://www.digitalocean.com

### 🥉 3. Linode (MEJOR SOPORTE)
- **Precio**: $12/mes
- **Specs**: 2 vCores, 2GB RAM, 50GB SSD
- **Perfecto para**: Confiabilidad máxima
- **Link**: https://www.linode.com

---

## 📋 Checklist de 7 Pasos Principales

### ✅ Paso 1: Preparación (30 min)
```bash
□ Contratar VPS y obtener SSH
□ Registrar/verificar dominio
□ Preparar variables de entorno Supabase
□ Actualizar sistema: apt update && apt upgrade -y
```

### ✅ Paso 2: Instalar Node.js (10 min)
```bash
□ curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
□ sudo apt install -y nodejs
□ npm install -g pm2
```

### ✅ Paso 3: Instalar Nginx (15 min)
```bash
□ sudo apt install -y nginx
□ Crear configuración de sitio en /etc/nginx/sites-available/
□ Habilitar sitio
□ sudo systemctl reload nginx
```

### ✅ Paso 4: Certificado SSL (10 min)
```bash
□ sudo apt install -y certbot python3-certbot-nginx
□ sudo certbot certonly --nginx -d tudominio.com
□ Configurar renovación automática
```

### ✅ Paso 5: Desplegar Aplicación (30 min)
```bash
□ git clone repositorio o copiar archivos
□ npm install --production en directorio /server
□ Crear archivo .env con credenciales
□ Crear ecosystem.config.js
```

### ✅ Paso 6: Iniciar con PM2 (10 min)
```bash
□ pm2 start ecosystem.config.js --env production
□ pm2 startup && pm2 save
□ pm2 status (verificar 3 procesos)
□ pm2 logs (sin errores)
```

### ✅ Paso 7: Configurar Firewall (5 min)
```bash
□ sudo ufw enable
□ sudo ufw allow 22/tcp (SSH)
□ sudo ufw allow 80/tcp (HTTP)
□ sudo ufw allow 443/tcp (HTTPS)
```

---

## 🔐 Configuración Seguridad Crítica

```bash
# 1. Cambiar contraseña root
sudo passwd root

# 2. Crear usuario sin root (deployer)
adduser deployer && usermod -aG sudo deployer

# 3. Deshabilitar login root por SSH
sudo nano /etc/ssh/sshd_config
# PermitRootLogin no
# PasswordAuthentication no
sudo systemctl restart sshd

# 4. Configurar firewall
sudo ufw enable
sudo ufw default deny incoming

# 5. Instalar Fail2Ban
sudo apt install -y fail2ban
sudo systemctl start fail2ban

# 6. Proteger .env
chmod 600 /home/deployer/app/server/.env
```

---

## 📊 Arquitectura Visual

```
┌─────────────────┐
│   Internet      │
└────────┬────────┘
         │
    ┌────▼──────┐
    │ Nginx:443 │ (Reverse Proxy)
    │SSL+Cache  │
    └────┬──────┘
         │
    ┌────▼─────────────────┐
    │  Load Balancing      │
    │  (Round Robin)       │
    └────┬───────┬───┬─────┘
         │       │   │
    ┌────▼─┐ ┌──▼──┐ ┌──▼──┐
    │Node1 │ │Node2│ │Node3│ (PM2 Cluster)
    │:3001 │ │:3002│ │:3003│
    └────┬─┘ └──┬──┘ └──┬──┘
         │      │       │
         └──────┴───┬───┘
                    │
           ┌────────▼────────┐
           │ Supabase Cloud  │
           │ (PostgreSQL)    │
           └─────────────────┘
```

---

## 🔄 Comandos Más Usados

```bash
# ESTADO Y LOGS
pm2 status                    # Ver procesos
pm2 logs                      # Ver logs en tiempo real
pm2 monit                     # Monitor de recursos

# REINICIAR APLICACIÓN
pm2 reload all                # Sin downtime
pm2 restart all               # Con downtime
pm2 stop all && pm2 start ecosystem.config.js

# ACTUALIZAR DESDE GIT
cd /home/deployer/app
git pull origin main
cd server && npm install --production
pm2 reload all

# BACKUP Y RESTORE
./backup.sh                   # Crear backup
./restore.sh backup_FECHA.tar.gz  # Restaurar

# VER RECURSOS
free -h                       # Memoria
df -h                         # Disco
ps aux | grep node            # Procesos

# NGINX
sudo nginx -t                 # Verificar sintaxis
sudo systemctl reload nginx   # Recargar config
tail -f /var/log/nginx/access.log  # Ver requests

# CERTIFICADO SSL
sudo certbot certificates     # Ver certificados
sudo certbot renew --dry-run  # Test renovación
```

---

## ⚠️ Problemas Comunes y Soluciones Rápidas

| Problema | Causa | Solución |
|----------|-------|----------|
| "502 Bad Gateway" | Node.js caído | `pm2 logs && pm2 restart all` |
| "Connection refused" | Puerto bloqueado | `sudo ufw allow 3001` |
| "EADDRINUSE" | Puerto en uso | `lsof -i :3001 && sudo kill PID` |
| "Out of memory" | Fuga de memoria | `pm2 delete all && npm install` |
| "SSL expired" | Certificado expirado | `sudo certbot renew` |
| "Disk full" | Sin espacio | `rm -rf /tmp/* && apt clean` |

---

## 🚦 Verificación Post-Despliegue

```bash
# 1. Accesibilidad
curl -I https://tudominio.com/api/health
# Esperado: HTTP/2 200

# 2. Certificado válido
openssl s_client -connect tudominio.com:443
# Debe mostrar certificado válido

# 3. Procesos corriendo
pm2 status
# Esperado: 3 procesos online

# 4. Memoria y CPU
free -h && df -h
# CPU < 50%, RAM > 200MB libre

# 5. Base de datos conectada
# Verificar en logs: pm2 logs | grep -i "connected\|supabase"

# 6. Firewall habilitado
sudo ufw status
# Esperado: Status: active
```

---

## 📅 Mantenimiento Mensual

```
SEMANAL:
□ Revisar logs: pm2 logs --lines 500
□ Ver espacio disco: df -h
□ Revisar errores: grep ERROR /logs/app*.log

MENSUAL:
□ Actualizar sistema: apt update && apt upgrade
□ Revisar dependencias: npm audit && npm audit fix
□ Limpiar logs antiguos
□ Backup manual: ./backup.sh
□ Test de restauración

TRIMESTRAL:
□ Revisión de seguridad
□ Análisis de rendimiento
□ Actualización major de dependencias

ANUAL:
□ Renovación de certificado (automática)
□ Revisión completa de infraestructura
□ Planificación de escalabilidad
```

---

## 📞 Escalabilidad Futura

### Cuando empieces a tener problemas de capacidad:

**Corto plazo (Sin cambiar VPS):**
```bash
# Aumentar procesos Node.js
instances: 4  # De 3 a 4 en ecosystem.config.js
pm2 reload all

# Habilitar caché
npm install redis
# Ver documentación para implementar
```

**Mediano plazo:**
```bash
# Upgradear VPS
# DigitalOcean: $18 → $24 (2GB → 4GB)
# Añadir backup automático en S3
# Implementar CDN (Cloudflare)
```

**Largo plazo:**
```bash
# Load balancer dedicado
# PostgreSQL separada
# Microservicios
# Kubernetes
```

---

## 🎓 Documentación Adicional

Este plan de despliegue incluye 4 documentos complementarios:

1. **VPS_DEPLOYMENT_PLAN.md** (Este documento)
   - Plan completo con todas las fases
   - Detalles de cada configuración
   - Checklist extenso

2. **VPS_DEPLOYMENT_SCRIPTS.md**
   - Scripts automatizados listos para usar
   - Instalación, despliegue, monitoreo, backup

3. **VPS_PROVIDERS_COMPARISON.md**
   - Comparativa de proveedores
   - Matriz de decisión
   - Cotizaciones

4. **VPS_TROUBLESHOOTING_FAQS.md**
   - Problemas comunes y soluciones
   - Comandos de debugging
   - FAQs frecuentes

---

## ✅ Resultado Esperado

Después de seguir este plan, tendrás:

- ✅ **API REST** respondiendo en `https://tudominio.com/api/`
- ✅ **3 procesos Node.js** balanceados en Nginx
- ✅ **Certificado SSL** válido y automáticamente renovado
- ✅ **Base de datos** conectada a Supabase
- ✅ **Backups automáticos** cada noche
- ✅ **Monitoreo activo** de salud
- ✅ **Firewall** habilitado y protegido
- ✅ **Costo optimizado** a ~$12-20/mes
- ✅ **Uptime 99.9%** con reinicio automático

---

## 🎯 Próximos Pasos

1. **Decidir proveedor** → Elegir entre Hetzner, DigitalOcean, Linode
2. **Contratar VPS** → Obtener credenciales SSH
3. **Preparar variables** → Recopilar SUPABASE_URL, claves, etc.
4. **Ejecutar instalación** → Seguir los 7 pasos principales
5. **Verificar despliegue** → Correr checklist post-despliegue
6. **Documentar acceso** → Guardar credenciales en gestor seguro
7. **Monitoreo** → Configurar alertas y backups automáticos

---

## 📧 Support y Recursos

- **Documentación Node.js**: https://nodejs.org/docs/
- **PM2 Documentation**: https://pm2.io/docs/
- **Nginx Documentation**: https://nginx.org/en/docs/
- **Let's Encrypt**: https://letsencrypt.org/
- **Supabase Docs**: https://supabase.com/docs
- **Digital Ocean Guides**: https://www.digitalocean.com/community/tutorials

---

## 📝 Información de Contacto de Proveedores

| Proveedor | Soporte | Teléfono | Email |
|-----------|---------|----------|-------|
| DigitalOcean | https://support.digitalocean.com | - | support@digitalocean.com |
| Linode | https://www.linode.com/support/ | +1-609-380-7100 | support@linode.com |
| Vultr | https://www.vultr.com/support/ | - | support@vultr.com |
| Hetzner | https://docs.hetzner.cloud | - | support@hetzner.com |
| AWS | https://console.aws.amazon.com/support | - | - |

---

**Documento Preparado:** 10 de enero de 2026  
**Versión:** 1.0 FINAL  
**Completado**: 100% ✅

Para más detalles, ver documentos complementarios en el proyecto.

