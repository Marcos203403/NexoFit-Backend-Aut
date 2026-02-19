# Sistema de Autenticación - NexoFit API

## 📋 Descripción

Sistema de autenticación completo y escalable para NexoFit Backend, siguiendo las mejores prácticas de desarrollo y seguridad.

## 🏗️ Arquitectura

El sistema está organizado en capas siguiendo el patrón MVC y principios SOLID:

```
src/
├── controllers/      # Maneja las peticiones HTTP
├── services/        # Lógica de negocio
├── middlewares/     # Autenticación, validación y manejo de errores
├── validators/      # Validaciones de entrada con express-validator
├── utils/          # Utilidades (JWT, encriptación)
├── routes/         # Definición de rutas
└── config/         # Configuración (base de datos, etc.)
```

## 🔐 Características de Seguridad

- ✅ Contraseñas hasheadas con bcrypt (10 rondas de salt)
- ✅ Tokens JWT con expiración configurable
- ✅ Refresh tokens para renovación segura
- ✅ Validación robusta de contraseñas (mayúsculas, minúsculas, números, caracteres especiales)
- ✅ Validación de entrada en todas las rutas
- ✅ Protección contra SQL injection (usando Knex)
- ✅ Manejo centralizado de errores
- ✅ Mensajes de error seguros (no revelan información sensible)

## 📡 Endpoints

### Rutas Públicas

#### 1. Registro de Usuario

```http
POST /api/auth/register
```

**Body:**

```json
{
  "email": "usuario@ejemplo.com",
  "password": "Password123!",
  "first_name": "Juan",
  "last_name": "Pérez",
  "phone": "555-1234",
  "birth_date": "1990-01-15",
  "role": "client"
}
```

**Respuesta (201):**

```json
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "data": {
    "user": {
      "id": 1,
      "email": "usuario@ejemplo.com",
      "first_name": "Juan",
      "last_name": "Pérez",
      "role": "client",
      ...
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

#### 2. Inicio de Sesión

```http
POST /api/auth/login
```

**Body:**

```json
{
  "email": "usuario@ejemplo.com",
  "password": "Password123!"
}
```

**Respuesta (200):**

```json
{
  "success": true,
  "message": "Inicio de sesión exitoso",
  "data": {
    "user": { ... },
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

#### 3. Refrescar Token

```http
POST /api/auth/refresh
```

**Body:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Respuesta (200):**

```json
{
  "success": true,
  "message": "Token refrescado exitosamente",
  "data": {
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

#### 4. Recuperar Contraseña

```http
POST /api/auth/forgot-password
```

**Body:**

```json
{
  "email": "usuario@ejemplo.com"
}
```

#### 5. Verificar Disponibilidad de Email

```http
GET /api/auth/check-email/:email
```

**Respuesta (200):**

```json
{
  "success": true,
  "data": {
    "available": true
  }
}
```

### Rutas Protegidas (Requieren Token)

**Header requerido:**

```
Authorization: Bearer <accessToken>
```

#### 6. Obtener Info del Usuario (Token Info)

```http
GET /api/auth/me
```

**Respuesta (200):**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "usuario@ejemplo.com",
    "role": "client"
  }
}
```

#### 7. Obtener Perfil Completo

```http
GET /api/auth/profile
```

**Respuesta (200):**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "usuario@ejemplo.com",
    "first_name": "Juan",
    "last_name": "Pérez",
    "phone": "555-1234",
    "birth_date": "1990-01-15",
    "weight": 75.5,
    "height": 180,
    "role": "client",
    "image_url": null,
    "is_active": 1,
    "created_at": "2026-02-19T..."
  }
}
```

#### 8. Actualizar Perfil

```http
PUT /api/auth/profile
```

**Body (todos los campos son opcionales):**

```json
{
  "first_name": "Juan Carlos",
  "last_name": "Pérez García",
  "phone": "555-5678",
  "birth_date": "1990-01-15",
  "weight": 75.5,
  "height": 180,
  "image_url": "https://ejemplo.com/imagen.jpg"
}
```

#### 9. Cambiar Contraseña

```http
POST /api/auth/change-password
```

**Body:**

```json
{
  "currentPassword": "Password123!",
  "newPassword": "NewPassword456!",
  "confirmPassword": "NewPassword456!"
}
```

#### 10. Cerrar Sesión

```http
POST /api/auth/logout
```

## 🔑 Middleware de Autenticación

### `authenticate`

Verifica que el usuario esté autenticado.

```javascript
const { authenticate } = require("./middlewares/auth.middleware");

router.get("/protected", authenticate, controller.method);
```

### `authorize(...roles)`

Verifica que el usuario tenga uno de los roles especificados.

```javascript
const { authenticate, authorize } = require("./middlewares/auth.middleware");

// Solo admins
router.delete(
  "/users/:id",
  authenticate,
  authorize("admin"),
  controller.delete,
);

// Admins e instructores
router.get(
  "/classes",
  authenticate,
  authorize("admin", "instructor"),
  controller.list,
);
```

### `optionalAuthenticate`

Autenticación opcional (no falla si no hay token).

```javascript
const { optionalAuthenticate } = require("./middlewares/auth.middleware");

router.get("/public-with-benefits", optionalAuthenticate, controller.method);
```

## 📝 Validadores

Todos los validadores están definidos en `validators/auth.validator.js` usando express-validator:

- `registerValidation` - Validación para registro
- `loginValidation` - Validación para login
- `refreshTokenValidation` - Validación para refresh token
- `updateProfileValidation` - Validación para actualizar perfil
- `changePasswordValidation` - Validación para cambio de contraseña
- `forgotPasswordValidation` - Validación para recuperar contraseña
- `checkEmailValidation` - Validación para verificar email

**Uso:**

```javascript
const { registerValidation } = require("./validators/auth.validator");
const { handleValidationErrors } = require("./middlewares/errorHandler");

router.post(
  "/register",
  registerValidation,
  handleValidationErrors,
  controller.register,
);
```

## 🛠️ Utilidades

### JWT Utils (`utils/jwt.js`)

```javascript
const {
  generateTokens,
  verifyAccessToken,
  verifyRefreshToken,
} = require("./utils/jwt");

// Generar tokens
const tokens = generateTokens(user);

// Verificar access token
const decoded = verifyAccessToken(token);

// Verificar refresh token
const decoded = verifyRefreshToken(refreshToken);
```

### Encryption Utils (`utils/encryption.js`)

```javascript
const {
  hashPassword,
  comparePassword,
  validatePasswordStrength,
} = require("./utils/encryption");

// Hashear contraseña
const hashed = await hashPassword("Password123!");

// Comparar contraseña
const isValid = await comparePassword("Password123!", hashed);

// Validar fortaleza
const validation = validatePasswordStrength("Password123!");
```

## 🚀 Instalación y Uso

1. **Instalar dependencias:**

```bash
npm install
```

2. **Configurar variables de entorno:**

```bash
cp .env.example .env
```

Editar `.env` con tus configuraciones.

3. **Iniciar el servidor:**

```bash
npm start
```

## 📦 Dependencias

- `express` - Framework web
- `bcryptjs` - Encriptación de contraseñas
- `jsonwebtoken` - Generación y verificación de JWT
- `express-validator` - Validación de entrada
- `knex` - Query builder para base de datos
- `mysql2` - Driver de MySQL/MariaDB
- `cors` - Manejo de CORS

## 🔒 Requisitos de Contraseña

- Mínimo 8 caracteres
- Al menos una letra mayúscula
- Al menos una letra minúscula
- Al menos un número
- Al menos un carácter especial (!@#$%^&\*(),.?":{}|<>)

## 🎯 Mejores Prácticas Implementadas

1. **Separación de responsabilidades** - Controladores, servicios, validadores separados
2. **Validación en capas** - Validación de entrada + validación de negocio
3. **Manejo centralizado de errores** - Middleware global de errores
4. **Seguridad JWT** - Tokens con expiración, refresh tokens
5. **No exponemos información sensible** - Contraseñas nunca se devuelven en respuestas
6. **Código reutilizable** - Utilidades y middlewares compartidos
7. **Documentación clara** - JSDoc en funciones importantes
8. **Mensajes de error descriptivos** - Pero sin revelar detalles de seguridad

## 🔄 Flujo de Autenticación

1. Usuario se registra o inicia sesión
2. Backend genera access token (1h) y refresh token (7d)
3. Cliente guarda ambos tokens
4. Cliente usa access token en header Authorization
5. Cuando access token expira, cliente usa refresh token para obtener nuevos tokens
6. Si refresh token expira, usuario debe iniciar sesión nuevamente

## 🧪 Testing de Endpoints

Puedes probar los endpoints usando:

- Postman
- Thunder Client (extensión de VS Code)
- curl

**Ejemplo con curl:**

```bash
# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@nexofit.com","password":"NewPassword123!"}'

# Obtener perfil
curl -X GET http://localhost:8080/api/auth/profile \
  -H "Authorization: Bearer <tu-token>"
```

## 📄 Licencia

Este código es parte del proyecto NexoFit Backend.
