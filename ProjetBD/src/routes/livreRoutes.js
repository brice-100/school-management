const express = require('express');
const router = express.Router();
const livreController = require('../controllers/livreController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', livreController.getAll);
router.get('/:id', livreController.getOne);

router.use(restrictTo('admin'));
router.post('/', livreController.create);
router.put('/:id', livreController.update);
router.delete('/:id', livreController.remove);

module.exports = router;
