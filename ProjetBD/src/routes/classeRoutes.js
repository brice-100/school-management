// src/routes/classeRoutes.js
const express = require('express');
const router = express.Router();
const classeController = require('../controllers/classeController');
const { protect } = require('../middleware/authMiddleware');
const { allowAdmin } = require('../middleware/roleMiddleware');

router.use(protect);

router.get('/', classeController.getAll);
router.get('/:id', classeController.getOne);

router.use(allowAdmin(0, 1));  // Super Admin ET Directeur
router.post('/', classeController.create);
router.put('/:id', classeController.update);
router.delete('/:id', classeController.remove);
router.patch('/:id/restaurer', classeController.restore);

module.exports = router;
