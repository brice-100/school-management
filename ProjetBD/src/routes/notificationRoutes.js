const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware.protect);

router.get('/', notificationController.getAllNotifications);
router.get('/mine', notificationController.getMyNotifications);

module.exports = router;
