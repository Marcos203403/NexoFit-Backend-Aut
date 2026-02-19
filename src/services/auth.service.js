const { db } = require("../config/database");
const { hashPassword, comparePassword } = require("../utils/encryption");
const { generateTokens, verifyRefreshToken } = require("../utils/jwt");

/**
 * Servicio de autenticación
 * Contiene toda la lógica de negocio relacionada con autenticación
 */
class AuthService {
  /**
   * Registra un nuevo usuario
   * @param {Object} userData - Datos del usuario
   * @returns {Promise<Object>} Usuario creado y tokens
   */
  async register(userData) {
    const {
      email,
      password,
      first_name,
      last_name,
      phone,
      birth_date,
      role = "client",
    } = userData;

    // Verificar si el usuario ya existe
    const existingUser = await db("users").where({ email }).first();
    if (existingUser) {
      throw { status: 409, message: "El email ya está registrado" };
    }

    // Hashear la contraseña
    const hashedPassword = await hashPassword(password);

    // Crear el usuario
    const [userId] = await db("users").insert({
      email,
      password: hashedPassword,
      first_name,
      last_name,
      phone,
      birth_date,
      role,
      is_active: 1,
    });

    // Obtener el usuario creado (sin contraseña)
    const user = await db("users")
      .select(
        "id",
        "email",
        "first_name",
        "last_name",
        "phone",
        "birth_date",
        "role",
        "is_active",
        "created_at",
      )
      .where({ id: userId })
      .first();

    // Generar tokens
    const tokens = generateTokens(user);

    return {
      user,
      ...tokens,
    };
  }

  /**
   * Inicia sesión de un usuario
   * @param {string} email - Email del usuario
   * @param {string} password - Contraseña del usuario
   * @returns {Promise<Object>} Usuario y tokens
   */
  async login(email, password) {
    // Buscar usuario por email
    const user = await db("users").where({ email }).first();

    if (!user) {
      throw { status: 401, message: "Credenciales inválidas" };
    }

    // Verificar si el usuario está activo
    if (!user.is_active) {
      throw {
        status: 403,
        message: "Usuario inactivo. Contacte al administrador",
      };
    }

    // Comparar contraseñas
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      throw { status: 401, message: "Credenciales inválidas" };
    }

    // Eliminar contraseña del objeto usuario
    const { password: _, ...userWithoutPassword } = user;

    // Generar tokens
    const tokens = generateTokens(userWithoutPassword);

    return {
      user: userWithoutPassword,
      ...tokens,
    };
  }

  /**
   * Refresca el token de acceso usando un refresh token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<Object>} Nuevos tokens
   */
  async refreshToken(refreshToken) {
    try {
      // Verificar el refresh token
      const decoded = verifyRefreshToken(refreshToken);

      // Buscar usuario
      const user = await db("users")
        .select("id", "email", "role", "is_active")
        .where({ id: decoded.id })
        .first();

      if (!user) {
        throw { status: 401, message: "Usuario no encontrado" };
      }

      if (!user.is_active) {
        throw { status: 403, message: "Usuario inactivo" };
      }

      // Generar nuevos tokens
      const tokens = generateTokens(user);

      return tokens;
    } catch (error) {
      throw { status: 401, message: error.message || "Refresh token inválido" };
    }
  }

  /**
   * Obtiene el perfil de un usuario
   * @param {number} userId - ID del usuario
   * @returns {Promise<Object>} Datos del usuario
   */
  async getProfile(userId) {
    const user = await db("users")
      .select(
        "id",
        "email",
        "first_name",
        "last_name",
        "phone",
        "birth_date",
        "weight",
        "height",
        "role",
        "image_url",
        "is_active",
        "created_at",
      )
      .where({ id: userId })
      .first();

    if (!user) {
      throw { status: 404, message: "Usuario no encontrado" };
    }

    return user;
  }

  /**
   * Actualiza el perfil de un usuario
   * @param {number} userId - ID del usuario
   * @param {Object} updateData - Datos a actualizar
   * @returns {Promise<Object>} Usuario actualizado
   */
  async updateProfile(userId, updateData) {
    const {
      first_name,
      last_name,
      phone,
      birth_date,
      weight,
      height,
      image_url,
    } = updateData;

    // Campos permitidos para actualizar
    const allowedFields = {};
    if (first_name !== undefined) allowedFields.first_name = first_name;
    if (last_name !== undefined) allowedFields.last_name = last_name;
    if (phone !== undefined) allowedFields.phone = phone;
    if (birth_date !== undefined) allowedFields.birth_date = birth_date;
    if (weight !== undefined) allowedFields.weight = weight;
    if (height !== undefined) allowedFields.height = height;
    if (image_url !== undefined) allowedFields.image_url = image_url;

    if (Object.keys(allowedFields).length === 0) {
      throw { status: 400, message: "No hay campos para actualizar" };
    }

    await db("users").where({ id: userId }).update(allowedFields);

    // Obtener usuario actualizado
    const updatedUser = await this.getProfile(userId);

    return updatedUser;
  }

  /**
   * Cambia la contraseña de un usuario
   * @param {number} userId - ID del usuario
   * @param {string} currentPassword - Contraseña actual
   * @param {string} newPassword - Nueva contraseña
   * @returns {Promise<Object>} Mensaje de éxito
   */
  async changePassword(userId, currentPassword, newPassword) {
    // Obtener usuario con contraseña
    const user = await db("users").where({ id: userId }).first();

    if (!user) {
      throw { status: 404, message: "Usuario no encontrado" };
    }

    // Verificar contraseña actual
    const isPasswordValid = await comparePassword(
      currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      throw { status: 401, message: "Contraseña actual incorrecta" };
    }

    // Hashear nueva contraseña
    const hashedPassword = await hashPassword(newPassword);

    // Actualizar contraseña
    await db("users")
      .where({ id: userId })
      .update({ password: hashedPassword });

    return { message: "Contraseña actualizada exitosamente" };
  }

  /**
   * Solicita un restablecimiento de contraseña (para implementar en el futuro) (TODO)
   * @param {string} email - Email del usuario
   * @returns {Promise<Object>} Mensaje de éxito
   * 
   * async requestPasswordReset(email) {
    const user = await db("users").where({ email }).first();

    if (!user) {
      // Por seguridad, no revelamos si el email existe o no
      return {
        message: "Si el email existe, recibirás un correo con instrucciones",
      };
    }

    // TODO: Aquí debería haber una lógica de envío de email con un token de restablecimiento

    return {
      message: "Si el email existe, recibirás un correo con instrucciones",
    };
  }
   * 
   */

  /**
   * Verifica si un email está disponible
   * @param {string} email - Email a verificar
   * @returns {Promise<Object>} Disponibilidad del email
   */
  async checkEmailAvailability(email) {
    const user = await db("users").where({ email }).first();
    return { available: !user };
  }
}

module.exports = new AuthService();
