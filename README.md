# Sistema de Gestión de Compras - API

Sistema completo para la gestión de compras institucionales con autenticación, autorización, flujo de aprobaciones y seguimiento completo del proceso de adquisiciones.

## 🚀 Características

- **Autenticación JWT** con roles de usuario
- **Gestión de solicitudes** de compra con flujo de aprobaciones
- **Administración de proveedores** y cotizaciones
- **Seguimiento completo** desde solicitud hasta facturación
- **Sistema de notificaciones** en tiempo real
- **Auditoría completa** de todas las operaciones
- **API RESTful** bien documentada
- **Validaciones robustas** y manejo de errores

## 📋 Requisitos

- **Node.js** >= 16.0.0
- **MySQL** >= 8.0
- **npm** >= 8.0.0

## 🛠️ Instalación

### 1. Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/procurement-system-api.git
cd procurement-system-api
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar el archivo .env con tus configuraciones
nano .env
```

### 4. Configurar base de datos
```bash
# Crear base de datos
mysql -u root -p
CREATE DATABASE procurement_system;
EXIT;

# Ejecutar migraciones (si usas Sequelize CLI)
npm run db:setup

# O sincronizar modelos (desarrollo)
# Los modelos se sincronizarán automáticamente al iniciar
```

### 5. Iniciar el servidor
```bash
# Desarrollo
npm run dev

# Producción
npm start
```

## 📁 Estructura del Proyecto

```
procurement-system-api/
├── server.js                 # Punto de entrada principal
├── src/
│   ├── config/               # Configuraciones
│   │   └── database.js       # Configuración de BD
│   ├── controllers/          # Controladores
│   │   ├── authController.js
│   │   └── solicitudesController.js
│   ├── middleware/           # Middlewares
│   │   ├── authMiddleware.js
│   │   ├── errorMiddleware.js
│   │   └── validationMiddleware.js
│   ├── models/               # Modelos de Sequelize
│   │   ├── index.js
│   │   ├── Usuario.js
│   │   ├── Solicitud.js
│   │   └── ...
│   ├── routes/               # Rutas de la API
│   │   ├── index.js
│   │   ├── authRoutes.js
│   │   └── solicitudesRoutes.js
│   ├── services/             # Servicios
│   │   └── databaseService.js
│   └── utils/                # Utilidades
│       ├── helpers.js
│       └── logger.js
├── logs/                     # Archivos de log
├── uploads/                  # Archivos subidos
├── tests/                    # Pruebas
├── .env.example              # Variables de entorno ejemplo
├── package.json              # Dependencias y scripts
└── README.md                 # Este archivo
```

## 🔧 Configuración

### Variables de Entorno (.env)

```env
# Base de datos
DB_HOST=localhost
DB_PORT=3306
DB_NAME=procurement_system
DB_USER=root
DB_PASSWORD=tu_password

# Servidor
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET=tu_clave_secreta_muy_segura
JWT_EXPIRES_IN=24h

# Archivos
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
```

## 📚 API Endpoints

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registrar usuario (admin)
- `GET /api/auth/me` - Perfil del usuario actual

### Solicitudes
- `GET /api/solicitudes` - Listar solicitudes
- `POST /api/solicitudes` - Crear solicitud
- `GET /api/solicitudes/:id` - Obtener solicitud
- `PUT /api/solicitudes/:id` - Actualizar solicitud
- `DELETE /api/solicitudes/:id` - Eliminar solicitud

### Otros módulos
- `GET /api/usuarios` - Gestión de usuarios
- `GET /api/departamentos` - Departamentos
- `GET /api/proveedores` - Proveedores
- `GET /api/aprobaciones` - Aprobaciones
- `GET /api/cotizaciones` - Cotizaciones
- `GET /api/compras` - Compras
- `GET /api/facturas` - Facturas
- `GET /api/reportes` - Reportes
- `GET /api/notificaciones` - Notificaciones

## 🔐 Autenticación

El sistema usa JWT (JSON Web Tokens) para autenticación. Incluye el token en el header:

```bash
Authorization: Bearer tu_jwt_token_aqui
```

### Roles de