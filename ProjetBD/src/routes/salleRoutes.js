// src/routes/salleRoutes.js
const express = require('express');
const router = express.Router();
const salleController = require('../controllers/salleController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', salleController.getAll);
router.get('/:id', salleController.getOne);

router.use(restrictTo('admin'));
router.post('/', salleController.create);
router.put('/:id', salleController.update);
router.delete('/:id', salleController.remove);

module.exports = router;
