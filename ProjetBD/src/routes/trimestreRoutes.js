const express = require('express');
const router = express.Router();
const trimestreController = require('../controllers/trimestreController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', trimestreController.getAll);
router.get('/:id', trimestreController.getOne);

router.use(restrictTo('admin'));
router.post('/', trimestreController.create);
router.put('/:id', trimestreController.update);
router.delete('/:id', trimestreController.remove);

module.exports = router;
