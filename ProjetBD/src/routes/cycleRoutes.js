// src/routes/cycleRoutes.js
const express = require('express');
const router = express.Router();
const cycleController = require('../controllers/cycleController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', cycleController.getAll);
router.get('/:id', cycleController.getOne);

router.use(restrictTo('admin'));
router.post('/', cycleController.create);
router.put('/:id', cycleController.update);
router.delete('/:id', cycleController.remove);

module.exports = router;
