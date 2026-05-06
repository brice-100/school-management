// src/routes/coursRoutes.js
const express = require('express');
const router = express.Router();
const coursController = require('../controllers/coursController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', coursController.getAll);
router.get('/:id', coursController.getOne);

router.use(restrictTo('admin'));
router.post('/', coursController.create);
router.put('/:id', coursController.update);
router.patch('/:id/statut', coursController.updateStatut);
router.delete('/:id', coursController.remove);

module.exports = router;
