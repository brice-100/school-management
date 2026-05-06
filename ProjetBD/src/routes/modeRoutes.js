const express = require('express');
const router = express.Router();
const modeController = require('../controllers/modeController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', modeController.getAll);

router.use(restrictTo('admin'));
router.post('/', modeController.create);
router.patch('/:id', modeController.update);

module.exports = router;
