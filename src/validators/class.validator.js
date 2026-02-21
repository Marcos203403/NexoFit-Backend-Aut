/**
 * @file Middleware de validación para los datos de las clases.
 * @module validators/class.validator
 */

function validateClassData(req, res, next) {
    const { modalityId, instructorId, startTime, endTime, capacity } = req.body;

    if (!modalityId || !instructorId || !startTime || !endTime || !capacity) {
        return res.status(400).json({ error: 'Faltan campos obligatorios por rellenar' });
    }

    next();
}

module.exports = {
    validateClassData
};