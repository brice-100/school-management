const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', messageController.getAll);
router.get('/:id', messageController.getOne);

router.use(restrictTo('admin', 'parent', 'teacher'));
router.post('/', messageController.create);
router.put('/:id', messageController.update);
router.delete('/:id', messageController.remove);

module.exports = router;
