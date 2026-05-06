const express = require('express');
const router = express.Router();
const natureEpreuveController = require('../controllers/natureEpreuveController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/', natureEpreuveController.getAll);

module.exports = router;
