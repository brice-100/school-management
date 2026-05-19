const express = require('express');
const router = express.Router();
const devoirController = require('../controllers/devoirController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const { uploadEpreuve, handleMulterError } = require('../middleware/uploadMiddleware');

router.use(protect);

router.get('/', devoirController.getDevoirs);

router.use(restrictTo('admin', 'teacher'));
router.post('/', uploadEpreuve, handleMulterError, devoirController.createDevoir);
router.put('/:id', uploadEpreuve, handleMulterError, devoirController.updateDevoir);
router.delete('/:id', devoirController.deleteDevoir);

module.exports = router;
