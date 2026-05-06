const express = require('express');
const router = express.Router();
const scolariteController = require('../controllers/scolariteController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', scolariteController.getAll);
router.get('/:id', scolariteController.getOne);

router.use(restrictTo('admin'));
router.post('/', scolariteController.create);
router.put('/:id', scolariteController.update);
router.delete('/:id', scolariteController.remove);

module.exports = router;
