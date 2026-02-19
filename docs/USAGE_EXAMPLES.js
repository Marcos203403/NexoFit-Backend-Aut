/**
 * EJEMPLOS DE USO - Sistema de Autenticación NexoFit
 *
 * Este archivo contiene ejemplos de cómo usar las diferentes funcionalidades
 * del sistema de autenticación en otros módulos de la aplicación.
 */

// ============================================================================
// 1. USAR AUTENTICACIÓN EN RUTAS
// ============================================================================

const express = require("express");
const router = express.Router();
const { authenticate, authorize } = require("./middlewares/auth.middleware");

// Ruta pública (sin autenticación)
router.get("/public", (req, res) => {
  res.json({ message: "Esta es una ruta pública" });
});

// Ruta protegida (requiere autenticación)
router.get("/protected", authenticate, (req, res) => {
  // req.user contiene: { id, email, role }
  res.json({
    message: "Esta es una ruta protegida",
    user: req.user,
  });
});

// Ruta solo para admins
router.delete("/users/:id", authenticate, authorize("admin"), (req, res) => {
  res.json({ message: "Solo admins pueden hacer esto" });
});

// Ruta para admins e instructores
router.get(
  "/dashboard",
  authenticate,
  authorize("admin", "instructor"),
  (req, res) => {
    res.json({ message: "Dashboard para admins e instructores" });
  },
);

// ============================================================================
// 2. USAR SERVICIOS DE AUTENTICACIÓN
// ============================================================================

const authService = require("./services/auth.service");

// Ejemplo: Crear usuario desde otro servicio
async function crearUsuarioAdmin() {
  try {
    const result = await authService.register({
      email: "nuevo@admin.com",
      password: "AdminPass123!",
      first_name: "Nuevo",
      last_name: "Administrador",
      role: "admin",
    });

    console.log("Usuario creado:", result.user);
    console.log("Access Token:", result.accessToken);
  } catch (error) {
    console.error("Error:", error.message);
  }
}

// Ejemplo: Verificar credenciales
async function verificarCredenciales(email, password) {
  try {
    const result = await authService.login(email, password);
    return result;
  } catch (error) {
    console.error("Login fallido:", error.message);
    return null;
  }
}

// ============================================================================
// 3. VALIDAR CONTRASEÑAS
// ============================================================================

const { validatePasswordStrength } = require("./utils/encryption");

function validarPassword(password) {
  const validation = validatePasswordStrength(password);

  if (!validation.isValid) {
    console.log("Contraseña débil:", validation.message);
    return false;
  }

  console.log("Contraseña fuerte");
  return true;
}

// Ejemplos:
validarPassword("123456"); // ❌ Muy corta
validarPassword("password"); // ❌ Sin mayúsculas, números, caracteres especiales
validarPassword("Password123"); // ❌ Sin caracteres especiales
validarPassword("Password123!"); // ✅ Válida

// ============================================================================
// 4. TRABAJAR CON JWT MANUALMENTE
// ============================================================================

const { generateTokens, verifyAccessToken } = require("./utils/jwt");

// Generar tokens para un usuario
function generarTokensParaUsuario(user) {
  const tokens = generateTokens({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  console.log("Access Token:", tokens.accessToken);
  console.log("Refresh Token:", tokens.refreshToken);
  return tokens;
}

// Verificar un token manualmente
function verificarToken(token) {
  try {
    const decoded = verifyAccessToken(token);
    console.log("Token válido para usuario:", decoded);
    return decoded;
  } catch (error) {
    console.error("Token inválido:", error.message);
    return null;
  }
}

// ============================================================================
// 5. MIDDLEWARE PERSONALIZADO CON AUTENTICACIÓN
// ============================================================================

const { authenticate } = require("./middlewares/auth.middleware");

// Middleware para verificar que el usuario sea el propietario del recurso
const checkOwnership = (resourceUserIdField = "user_id") => {
  return async (req, res, next) => {
    try {
      // Asumiendo que el recurso tiene el ID del usuario
      const resourceUserId =
        req.params[resourceUserIdField] || req.body[resourceUserIdField];

      // Los admins pueden acceder a cualquier recurso
      if (req.user.role === "admin") {
        return next();
      }

      // Verificar que el usuario sea el propietario
      if (parseInt(resourceUserId) !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "No tienes permiso para acceder a este recurso",
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Uso:
router.put(
  "/bookings/:id",
  authenticate,
  checkOwnership("user_id"),
  async (req, res) => {
    // Solo el propietario de la reserva o un admin puede modificarla
    res.json({ message: "Reserva actualizada" });
  },
);

// ============================================================================
// 6. EJEMPLO DE CONTROLADOR COMPLETO CON AUTENTICACIÓN
// ============================================================================

const { db } = require("./config/database");
const { authenticate, authorize } = require("./middlewares/auth.middleware");

// Controlador de reservas
class BookingController {
  // Obtener reservas del usuario autenticado
  async getMyBookings(req, res, next) {
    try {
      const userId = req.user.id;

      const bookings = await db("bookings")
        .where("user_id", userId)
        .select("*");

      res.json({
        success: true,
        data: bookings,
      });
    } catch (error) {
      next(error);
    }
  }

  // Crear reserva (solo clientes)
  async createBooking(req, res, next) {
    try {
      const userId = req.user.id;
      const { class_id } = req.body;

      const [bookingId] = await db("bookings").insert({
        user_id: userId,
        class_id,
        status: "confirmed",
      });

      res.status(201).json({
        success: true,
        message: "Reserva creada exitosamente",
        data: { id: bookingId },
      });
    } catch (error) {
      next(error);
    }
  }

  // Ver todas las reservas (solo admins)
  async getAllBookings(req, res, next) {
    try {
      const bookings = await db("bookings")
        .join("users", "bookings.user_id", "users.id")
        .join("classes", "bookings.class_id", "classes.id")
        .select(
          "bookings.*",
          "users.email",
          "users.first_name",
          "users.last_name",
        );

      res.json({
        success: true,
        data: bookings,
      });
    } catch (error) {
      next(error);
    }
  }
}

// Rutas de reservas
const bookingController = new BookingController();
router.get("/my-bookings", authenticate, bookingController.getMyBookings);
router.post(
  "/bookings",
  authenticate,
  authorize("client"),
  bookingController.createBooking,
);
router.get(
  "/all-bookings",
  authenticate,
  authorize("admin"),
  bookingController.getAllBookings,
);

// ============================================================================
// 7. MANEJO DE ERRORES PERSONALIZADO
// ============================================================================

// Error personalizado para validación de negocio
class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.status = 400;
    this.name = "ValidationError";
  }
}

// Ejemplo de uso en un servicio
async function reservarClase(userId, classId) {
  // Verificar capacidad
  const classInfo = await db("classes").where("id", classId).first();

  if (!classInfo) {
    throw new ValidationError("Clase no encontrada");
  }

  const bookingsCount = await db("bookings")
    .where("class_id", classId)
    .count("id as total")
    .first();

  if (bookingsCount.total >= classInfo.capacity) {
    throw new ValidationError("La clase está llena");
  }

  // Crear reserva...
}

// ============================================================================
// 8. TESTING DE AUTENTICACIÓN
// ============================================================================

// Función helper para tests
async function getAuthToken(email = "admin@nexofit.com", password = "123456") {
  const authService = require("./services/auth.service");

  try {
    const result = await authService.login(email, password);
    return result.accessToken;
  } catch (error) {
    console.error("Error obteniendo token:", error.message);
    return null;
  }
}

// Uso en tests:
async function testProtectedEndpoint() {
  const token = await getAuthToken();

  // Simular request con token
  // fetch('/api/protected', {
  //     headers: {
  //         'Authorization': `Bearer ${token}`
  //     }
  // });
}

// ============================================================================
// 9. INTEGRACIÓN CON FRONTEND
// ============================================================================

/*
// Frontend - JavaScript/React ejemplo

// Guardar tokens después del login
async function login(email, password) {
    const response = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (data.success) {
        // Guardar en localStorage o en estado global
        localStorage.setItem('accessToken', data.data.accessToken);
        localStorage.setItem('refreshToken', data.data.refreshToken);
        localStorage.setItem('user', JSON.stringify(data.data.user));
    }
    
    return data;
}

// Hacer peticiones autenticadas
async function getProfile() {
    const token = localStorage.getItem('accessToken');
    
    const response = await fetch('http://localhost:8080/api/auth/profile', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    
    return response.json();
}

// Refrescar token cuando expire
async function refreshToken() {
    const refreshToken = localStorage.getItem('refreshToken');
    
    const response = await fetch('http://localhost:8080/api/auth/refresh', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken })
    });
    
    const data = await response.json();
    
    if (data.success) {
        localStorage.setItem('accessToken', data.data.accessToken);
        localStorage.setItem('refreshToken', data.data.refreshToken);
    }
    
    return data;
}

// Interceptor para manejar tokens expirados automáticamente
async function fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem('accessToken');
    
    const response = await fetch(url, {
        ...options,
        headers: {
            ...options.headers,
            'Authorization': `Bearer ${token}`
        }
    });
    
    // Si el token expiró, refrescar y reintentar
    if (response.status === 401) {
        const refreshResult = await refreshToken();
        
        if (refreshResult.success) {
            // Reintentar con nuevo token
            return fetchWithAuth(url, options);
        } else {
            // Si el refresh falló, redirigir al login
            window.location.href = '/login';
        }
    }
    
    return response;
}
*/

// ============================================================================

module.exports = {
  // Exportar lo que necesites para tests
  validarPassword,
  verificarToken,
  checkOwnership,
};
