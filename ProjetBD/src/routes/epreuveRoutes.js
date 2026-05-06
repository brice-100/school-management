const express = require('express');
const router = express.Router();
const epreuveController = require('../controllers/epreuveController');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const { uploadEpreuve, handleMulterError } = require('../middleware/uploadMiddleware');

router.use(protect);

router.get('/',         epreuveController.getAll);
router.get('/classe',   epreuveController.getClasse);
router.get('/:id',      epreuveController.getOne);

router.use(restrictTo('admin', 'teacher'));
// POST avec support multipart/form-data pour upload de fichier
router.post('/',    uploadEpreuve, handleMulterError, epreuveController.create);
router.put('/:id',  uploadEpreuve, handleMulterError, epreuveController.update);
router.delete('/:id', epreuveController.remove);

module.exports = router;
