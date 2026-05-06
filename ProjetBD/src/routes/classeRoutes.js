// src/routes/classeRoutes.js
const express = require('express');
const router = express.Router();
const classeController = require('../controllers/classeController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', classeController.getAll);
router.get('/:id', classeController.getOne);

router.use(restrictTo('admin'));
router.post('/', classeController.create);
router.put('/:id', classeController.update);
router.delete('/:id', classeController.remove);

module.exports = router;
