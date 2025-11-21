# Configuración de Supabase - Instrucciones

## ✅ Paso 1: Ejecutar Script de Configuración

Ejecuta el siguiente comando en la raíz del proyecto:

```bash
.\setup-supabase-env.bat
```

Esto creará/actualizará los archivos `.env` con las credenciales de Supabase.

---

## ✅ Paso 2: Ejecutar Schema SQL en Supabase

1. Ve a tu proyecto en Supabase: https://prymijhlpoeqhihztuwl.supabase.co
2. Click en **SQL Editor** en el sidebar
3. Click en **New query**
4. Abre el archivo `server/src/config/supabase-schema.sql`
5. Copia **TODO** el contenido
6. Pégalo en el SQL Editor
7. Click en **Run** (o Ctrl+Enter)

✅ Deberías ver: "Success. No rows returned"

---

## ✅ Paso 3: Crear Buckets de Storage

### Bucket 1: product-images

1. En Supabase, click en **Storage** en el sidebar
2. Click en **Create a new bucket**
3. Configurar:
   - Name: `product-images`
   - Public bucket: ✅ (marcar)
   - File size limit: `5 MB`
   - Allowed MIME types: `image/jpeg, image/png, image/webp`
4. Click en **Create bucket**

### Bucket 2: category-images

Repetir con:
- Name: `category-images`
- Public bucket: ✅
- File size limit: `5 MB`

### Bucket 3: logos

Repetir con:
- Name: `logos`
- Public bucket: ✅
- File size limit: `2 MB`

---

## ✅ Paso 4: Configurar Políticas de Storage

1. Ve a **SQL Editor** > **New query**
2. Abre el archivo `server/src/config/supabase-storage-policies.sql`
3. Copia **TODO** el contenido
4. Pégalo y ejecuta

---

## ✅ Paso 5: Crear Usuario Admin

1. En Supabase, ve a **Authentication** > **Users**
2. Click en **Add user** > **Create new user**
3. Configurar:
   - Email: `admin@magnolia.com`
   - Password: (tu contraseña segura)
   - Auto Confirm User: ✅
4. Click en **Create user**

### Asignar Rol Admin

1. Ve a **SQL Editor** > **New query**
2. Ejecuta:

```sql
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'admin@magnolia.com';
```

---

## ✅ Paso 6: Reiniciar Servidores

1. Detén los servidores actuales (Ctrl+C en cada terminal)
2. Inicia el cliente:
   ```bash
   cd client
   npm run dev
   ```
3. Inicia el servidor:
   ```bash
   cd server
   npm run dev
   ```

---

## ✅ Paso 7: Probar Conexión

Ejecuta el script de prueba:

```bash
cd client
node src/test-supabase.js
```

Deberías ver:
- ✓ Configuración verificada
- ✓ Conexión a base de datos exitosa
- ✓ Storage accesible
- ✓ Buckets encontrados

---

## 🎯 Checklist

- [ ] Ejecutar `setup-supabase-env.bat`
- [ ] Ejecutar schema SQL en Supabase
- [ ] Crear 3 buckets (product-images, category-images, logos)
- [ ] Ejecutar políticas de storage
- [ ] Crear usuario admin
- [ ] Asignar rol admin
- [ ] Reiniciar servidores
- [ ] Ejecutar test de conexión

---

## 🆘 Si algo falla

**Error: "Invalid API key"**
- Verifica que ejecutaste `setup-supabase-env.bat`
- Reinicia los servidores

**Error: "relation does not exist"**
- Verifica que ejecutaste el schema SQL completo
- Ve a Table Editor y verifica que las tablas existan

**Error: "bucket not found"**
- Verifica que creaste los 3 buckets
- Verifica que los nombres sean exactos (sin espacios)
