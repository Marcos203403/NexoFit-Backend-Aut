/**
 * @file Rutas (Endpoints) de la API para la gestión de categorías.
 * @module routes/category.route
 */

const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');
const categoryValidator = require('../validators/category.validator');
const { handleValidationErrors } = require('../middlewares/errorHandler');



// Obtener todas las categorías
// GET: http://localhost:8080/categories
router.get("/", categoryController.getAllCategories);

// Obtener todas las categorías con sus primeras 3 modalidades
// GET: http://localhost:8080/categories/with-modalities
router.get("/with-modalities", categoryController.getCategoriesWithModalities);

// Obtener una categoría específica por su ID
// GET: http://localhost:8080/categories/:id
router.get("/:id", categoryController.getCategoryById);

// Crear una nueva categoría
// POST: http://localhost:8080/categories
router.post(
  "/",
  categoryValidator.validateCategoryData,
  handleValidationErrors,
  categoryController.createCategory,
);

// Actualizar una categoría existente
// PUT: http://localhost:8080/categories/:id
router.put(
  "/:id",
  categoryValidator.validateCategoryData,
  handleValidationErrors,
  categoryController.updateCategory,
);

// Eliminar una categoría
// DELETE: http://localhost:8080/categories/:id
router.delete("/:id", categoryController.deleteCategory);

module.exports = router;

// Obtener el precio de una categoría por su ID
// GET: http://localhost:8080/categories/:id/price
router.get("/:id/price", categoryController.getPriceByCategoryId);  
