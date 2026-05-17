// src/routes/parentRoutes.js
const express = require('express');
const router = express.Router();
const parentController = require('../controllers/parentController');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const uploadMiddleware = require('../middleware/uploadMiddleware');

router.use(protect);

router.get('/', parentController.getAll);
router.get('/mes-enfants', parentController.getMesEnfants);
router.get('/:id', parentController.getOne);

router.use(restrictTo('admin'));
// Use handleUpload(uploadUserPhoto) to parse multipart/form-data and handle optional photo
router.post('/', uploadMiddleware.handleUpload(uploadMiddleware.uploadUserPhoto), parentController.create);
router.put('/:id', uploadMiddleware.handleUpload(uploadMiddleware.uploadUserPhoto), parentController.update);
router.patch('/:id/statut', parentController.updateStatut);
router.delete('/:id', parentController.remove);
router.delete('/:id/hard', parentController.removeHard);
router.patch('/:id/restaurer', parentController.restore);

module.exports = router;
