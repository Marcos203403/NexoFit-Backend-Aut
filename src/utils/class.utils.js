/**
 * @file Utilidades para la lógica de negocio de las clases.
 * @module utils/class.utils
 */

/**
 * Calcula la duración de una clase en minutos.
 * @param {string|Date} startTime - Fecha/hora de inicio.
 * @param {string|Date} endTime - Fecha/hora de fin.
 * @returns {number} Duración en minutos.
 */
function calculateClassDuration(startTime, endTime) {
    const diffMs = new Date(endTime) - new Date(startTime);
    return Math.round(diffMs / (1000 * 60));
}

/**
 * Verifica que una fecha sea en el futuro.
 * @param {string|Date} date - Fecha a verificar.
 * @returns {boolean} true si la fecha es posterior al momento actual.
 */
function isFutureDate(date) {
    return new Date(date) > new Date();
}

module.exports = {
    calculateClassDuration,
    isFutureDate,
};
