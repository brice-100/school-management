const express = require('express');
const router = express.Router();
const messageParentController = require('../controllers/messageParentController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', messageParentController.getMessages);
router.post('/', messageParentController.createMessage);
router.post('/:id/repondre', messageParentController.repondreMessage);
router.patch('/:id/lu', messageParentController.markAsLu);

module.exports = router;
