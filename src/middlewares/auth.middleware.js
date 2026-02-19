const { verifyAccessToken } = require("../utils/jwt");

/**
 * Middleware para autenticar usuarios con JWT
 * Verifica que el token de acceso sea válido
 */
const authenticate = async (req, res, next) => {
  try {
    // Obtener token del header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Token de autenticación no proporcionado",
      });
    }

    // El formato esperado es: "Bearer <token>"
    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return res.status(401).json({
        success: false,
        message: "Formato de token inválido. Use: Bearer <token>",
      });
    }

    const token = parts[1];

    // Verificar el token
    const decoded = verifyAccessToken(token);

    // Agregar información del usuario al request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message || "Token inválido o expirado",
    });
  }
};

/**
 * Middleware para autorizar roles específicos
 * @param {...string} allowedRoles - Roles permitidos
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Usuario no autenticado",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "No tienes permisos para acceder a este recurso",
      });
    }

    next();
  };
};

/**
 * Middleware opcional de autenticación
 * No falla si no hay token, pero lo verifica si existe
 */
const optionalAuthenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader) {
      const parts = authHeader.split(" ");
      if (parts.length === 2 && parts[0] === "Bearer") {
        const token = parts[1];
        const decoded = verifyAccessToken(token);
        req.user = {
          id: decoded.id,
          email: decoded.email,
          role: decoded.role,
        };
      }
    }

    next();
  } catch (error) {
    // Si el token es inválido, simplemente no autenticamos
    next();
  }
};

module.exports = {
  authenticate,
  authorize,
  optionalAuthenticate,
};
