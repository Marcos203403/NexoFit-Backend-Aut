const authService = require("../services/auth.service");

/**
 * Controlador de autenticación
 * Maneja las peticiones HTTP y delega la lógica al servicio
 */
class AuthController {
  /**
   * POST /api/auth/register
   * Registra un nuevo usuario
   */
  async register(req, res, next) {
    try {
      const result = await authService.register(req.body);

      res.status(201).json({
        success: true,
        message: "Usuario registrado exitosamente",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/login
   * Inicia sesión de un usuario
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);

      res.status(200).json({
        success: true,
        message: "Inicio de sesión exitoso",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/refresh
   * Refresca el token de acceso
   */
  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const result = await authService.refreshToken(refreshToken);

      res.status(200).json({
        success: true,
        message: "Token refrescado exitosamente",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/auth/profile
   * Obtiene el perfil del usuario autenticado
   */
  async getProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const result = await authService.getProfile(userId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/auth/profile
   * Actualiza el perfil del usuario autenticado
   */
  async updateProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const result = await authService.updateProfile(userId, req.body);

      res.status(200).json({
        success: true,
        message: "Perfil actualizado exitosamente",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/change-password
   * Cambia la contraseña del usuario autenticado
   */
  async changePassword(req, res, next) {
    try {
      const userId = req.user.id;
      const { currentPassword, newPassword } = req.body;
      const result = await authService.changePassword(
        userId,
        currentPassword,
        newPassword,
      );

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/forgot-password
   * Solicita un restablecimiento de contraseña
   */
  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      const result = await authService.requestPasswordReset(email);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/auth/check-email/:email
   * Verifica si un email está disponible
   */
  async checkEmail(req, res, next) {
    try {
      const { email } = req.params;
      const result = await authService.checkEmailAvailability(email);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/logout
   * Cierra sesión (en una implementación real, invalidaría el token)
   */
  async logout(req, res, next) {
    try {
      // En una implementación más avanzada, aquí se podría:
      // - Guardar el token en una lista negra
      // - Eliminar el refresh token de la base de datos
      // Por ahora, solo devolvemos un mensaje de éxito

      res.status(200).json({
        success: true,
        message: "Sesión cerrada exitosamente",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/auth/me
   * Verifica el token y devuelve información del usuario
   */
  async me(req, res, next) {
    try {
      res.status(200).json({
        success: true,
        data: {
          id: req.user.id,
          email: req.user.email,
          role: req.user.role,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
