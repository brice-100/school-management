const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', sessionController.getAll);
router.get('/actives', sessionController.getActives);
router.get('/:id', sessionController.getOne);

router.use(restrictTo('admin', 'teacher'));
router.post('/', sessionController.create);
router.put('/:id', sessionController.update);
router.delete('/:id', sessionController.remove);

module.exports = router;
