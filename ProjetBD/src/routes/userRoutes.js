const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const { allowAdmin } = require('../middleware/roleMiddleware');

router.use(authMiddleware.protect);

router.get('/pending-count', userController.getPendingCount);
router.get('/', userController.getUsers);
router.patch('/:id/statut', allowAdmin(0), userController.updateStatut);

module.exports = router;
