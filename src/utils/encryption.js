const bcrypt = require("bcryptjs");

// Número de rondas para el salt (10 es un buen balance entre seguridad y performance)
const SALT_ROUNDS = 10;

/**
 * Hashea una contraseña usando bcrypt
 * @param {string} password - Contraseña en texto plano
 * @returns {Promise<string>} Contraseña hasheada
 */
const hashPassword = async (password) => {
  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
  } catch (error) {
    throw new Error("Error al hashear la contraseña");
  }
};

/**
 * Compara una contraseña en texto plano con una hasheada
 * @param {string} password - Contraseña en texto plano
 * @param {string} hashedPassword - Contraseña hasheada
 * @returns {Promise<boolean>} True si coinciden, false si no
 */
const comparePassword = async (password, hashedPassword) => {
  try {
    const isMatch = await bcrypt.compare(password, hashedPassword);
    return isMatch;
  } catch (error) {
    throw new Error("Error al comparar contraseñas");
  }
};

/**
 * Valida la fortaleza de una contraseña
 * @param {string} password - Contraseña a validar
 * @returns {Object} Objeto con isValid y mensaje
 */
const validatePasswordStrength = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (password.length < minLength) {
    return {
      isValid: false,
      message: `La contraseña debe tener al menos ${minLength} caracteres`,
    };
  }

  if (!hasUpperCase) {
    return {
      isValid: false,
      message: "La contraseña debe contener al menos una letra mayúscula",
    };
  }

  if (!hasLowerCase) {
    return {
      isValid: false,
      message: "La contraseña debe contener al menos una letra minúscula",
    };
  }

  if (!hasNumbers) {
    return {
      isValid: false,
      message: "La contraseña debe contener al menos un número",
    };
  }

  if (!hasSpecialChar) {
    return {
      isValid: false,
      message: "La contraseña debe contener al menos un carácter especial",
    };
  }

  return {
    isValid: true,
    message: "Contraseña válida",
  };
};

module.exports = {
  hashPassword,
  comparePassword,
  validatePasswordStrength,
};
