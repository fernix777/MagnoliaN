# E-Commerce WhatsApp - Plataforma de Ventas

Plataforma de e-commerce para accesorios de hogar y decoración con integración de WhatsApp para finalizar compras, dashboard administrativo completo e integración con servicios de envío argentinos (OCA, Andreani, Correo Argentino).

## 🚀 Características

- ✅ **Catálogo de productos** con variantes de color y tamaño
- ✅ **Carrito de compras** con persistencia
- ✅ **Checkout vía WhatsApp** - sin pasarela de pago
- ✅ **Calculadora de envío** integrada con carriers argentinos
- ✅ **Dashboard administrativo** completo
- ✅ **Gestión de productos** con imágenes múltiples
- ✅ **Sistema de categorías** y subcategorías
- ✅ **Diseño responsive** premium
- ✅ **Paleta de colores** sofisticada para deco y hogar

## 📁 Estructura del Proyecto

```
ecommerce-whatsapp/
├── client/                 # Frontend React + Vite
│   ├── public/
│   ├── src/
│   │   ├── components/    # Componentes React
│   │   ├── pages/         # Páginas
│   │   ├── context/       # Context API
│   │   ├── hooks/         # Custom hooks
│   │   ├── services/      # API calls
│   │   ├── utils/         # Utilidades
│   │   └── styles/        # CSS
│   └── package.json
│
└── server/                 # Backend Node.js + Express
    ├── src/
    │   ├── config/        # Configuraciones
    │   ├── controllers/   # Lógica de negocio
    │   ├── middleware/    # Middlewares
    │   ├── models/        # Modelos de datos
    │   ├── routes/        # Rutas API
    │   ├── services/      # Servicios externos
    │   └── utils/         # Utilidades
    ├── uploads/           # Imágenes subidas
    └── package.json
```

## 🛠️ Instalación

### Prerrequisitos

- Node.js 18+ instalado
- npm o yarn

### 1. Instalar dependencias del cliente

```bash
cd client
npm install
```

### 2. Instalar dependencias del servidor

```bash
cd server
npm install
```

### 3. Configurar variables de entorno

Edita el archivo `server/.env` con tus configuraciones:

```env
# WhatsApp
WHATSAPP_NUMBER=+5491112345678

# JWT
JWT_SECRET=tu-clave-secreta-super-segura

# APIs de envío (cuando tengas las credenciales)
OCA_API_KEY=tu-api-key
ANDREANI_API_KEY=tu-api-key
CORREO_ARGENTINO_API_KEY=tu-api-key
```

### 4. Inicializar base de datos

La base de datos se inicializa automáticamente al iniciar el servidor por primera vez.

## 🚀 Ejecutar el Proyecto

### Modo Desarrollo

**Terminal 1 - Cliente:**
```bash
cd client
npm run dev
```
El cliente estará disponible en: http://localhost:5173

**Terminal 2 - Servidor:**
```bash
cd server
npm run dev
```
El servidor estará disponible en: http://localhost:3000

### Acceder al Dashboard Admin

1. Navega a: http://localhost:5173/admin
2. Credenciales por defecto:
   - Usuario: `admin`
   - Contraseña: `admin123`

⚠️ **IMPORTANTE:** Cambia estas credenciales en producción.

## 📦 Tecnologías Utilizadas

### Frontend
- **React 18** - Librería UI
- **Vite** - Build tool
- **React Router** - Navegación
- **Axios** - HTTP client
- **CSS Variables** - Sistema de diseño

### Backend
- **Node.js** - Runtime
- **Express** - Framework web
- **SQLite** (better-sqlite3) - Base de datos
- **JWT** - Autenticación
- **Multer** - Upload de archivos
- **bcryptjs** - Encriptación de contraseñas

## 🎨 Sistema de Diseño

### Paleta de Colores

```css
--primary: #8B7355        /* Marrón cálido */
--secondary: #D4C4B0      /* Beige claro */
--accent: #C9A882         /* Dorado suave */
--off-white: #FAF8F5      /* Blanco cálido */
```

### Tipografía

- **Headings:** Playfair Display (serif elegante)
- **Body:** Montserrat (sans-serif moderna)

## 📱 Integración WhatsApp

Al finalizar una compra, el sistema:

1. Genera un mensaje formateado con:
   - Productos seleccionados con variantes
   - Datos del cliente
   - Método de envío seleccionado
   - Total a pagar

2. Abre WhatsApp Web/App con el mensaje pre-cargado
3. El cliente solo debe enviar el mensaje
4. El administrador recibe el pedido y coordina el pago

## 🚚 Integración de Envíos

El sistema calcula automáticamente costos de envío según código postal con:

- **OCA** - Express y estándar
- **Andreani** - Sucursal y domicilio
- **Correo Argentino** - Estándar

## 📝 API Endpoints

### Productos
- `GET /api/products` - Listar productos
- `GET /api/products/:slug` - Obtener producto
- `POST /api/products` - Crear producto (admin)
- `PUT /api/products/:id` - Actualizar producto (admin)
- `DELETE /api/products/:id` - Eliminar producto (admin)

### Categorías
- `GET /api/categories` - Listar categorías
- `POST /api/categories` - Crear categoría (admin)
- `PUT /api/categories/:id` - Actualizar categoría (admin)

### Envíos
- `POST /api/shipping/calculate` - Calcular costo de envío

### Auth
- `POST /api/auth/login` - Login admin
- `GET /api/auth/verify` - Verificar token

## 🔒 Seguridad

- Autenticación JWT para rutas admin
- Contraseñas hasheadas con bcrypt
- Validación de inputs
- CORS configurado
- Rate limiting (próximamente)

## 📄 Licencia

Este proyecto es privado y propietario.

## 👨‍💻 Desarrollo

Desarrollado para el mercado argentino de e-commerce con enfoque en decoración y hogar.

---

**¿Necesitas ayuda?** Contacta al desarrollador.
