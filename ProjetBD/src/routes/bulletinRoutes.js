const express = require('express');
const router = express.Router();
const bulletinController = require('../controllers/bulletinController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/:id', bulletinController.getBulletinData);
router.get('/:id/pdf', bulletinController.downloadBulletinPDF);

module.exports = router;
