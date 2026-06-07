// src/routes/parentRoutes.js
const express = require('express');
const router = express.Router();
const parentController = require('../controllers/parentController');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const { allowAdmin } = require('../middleware/roleMiddleware');
const uploadMiddleware = require('../middleware/uploadMiddleware');

router.use(protect);

router.get('/', parentController.getAll);
router.get('/mes-enfants', parentController.getMesEnfants);
router.get('/:id', parentController.getOne);

// Use handleUpload(uploadUserPhoto) to parse multipart/form-data and handle optional photo
router.post('/', allowAdmin(0), uploadMiddleware.handleUpload(uploadMiddleware.uploadUserPhoto), parentController.create);
router.put('/:id', allowAdmin(0, 1, 3), uploadMiddleware.handleUpload(uploadMiddleware.uploadUserPhoto), parentController.update);
router.patch('/:id/statut', allowAdmin(0), parentController.updateStatut);
router.delete('/:id', allowAdmin(0), parentController.remove);
router.delete('/:id/hard', allowAdmin(0), parentController.removeHard);
router.patch('/:id/restaurer', allowAdmin(0), parentController.restore);

module.exports = router;
