const express = require('express');
const router = express.Router();
const trancheController = require('../controllers/trancheController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', trancheController.getAll);
router.get('/:id', trancheController.getOne);

router.use(restrictTo('admin'));
router.post('/', trancheController.create);
router.put('/:id', trancheController.update);
router.delete('/:id', trancheController.remove);

module.exports = router;
