/**
 * @file Rutas (Endpoints) de la API para la gestión de clases.
 * @module route/class
 */

const express = require('express');
const router = express.Router();
const classController = require('../controllers/class.controller');
const classValidator = require('../validators/class.validator');
const { handleValidationErrors } = require("../middlewares/errorHandler");
const {
  authenticate,
  optionalAuthenticate,
  authorize,
} = require("../middlewares/auth.middleware");

// Obtener todas las clases (con autenticación opcional para isBooked/isFull)
// GET: http://localhost:8080/classes
router.get("/", optionalAuthenticate, classController.getAllClasses);

// Obtener las clases del instructor autenticado
// GET: http://localhost:8080/classes/my-classes
router.get(
  "/my-classes",
  authenticate,
  authorize("instructor", "admin"),
  classController.getMyClasses,
);

// Obtener una clase específica por su ID
// GET: http://localhost:8080/classes/:id
router.get("/:id", classController.getClassById);

// Crear una nueva clase
// POST: http://localhost:8080/classes
router.post(
  "/",
  classValidator.validateClassData,
  handleValidationErrors,
  classController.createClass,
);

// Actualizar una clase existente
// PUT: http://localhost:8080/classes/:id
router.put(
  "/:id",
  classValidator.validateClassData,
  handleValidationErrors,
  classController.updateClass,
);

// Eliminar una clase
// DELETE: http://localhost:8080/classes/:id
router.delete("/:id", classController.deleteClass);

module.exports = router;
