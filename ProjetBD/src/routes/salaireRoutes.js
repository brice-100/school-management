const express = require('express');
const router = express.Router();
const salaireController = require('../controllers/salaireController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

router.use(protect);

// Les routes /fiches-enseignant et /salaires sont traitées ici pour simplifier
router.get('/', restrictTo('admin'), salaireController.getAll);
router.get('/recap', restrictTo('admin'), salaireController.getRecap);

router.post('/', restrictTo('admin'), salaireController.createFiche); // /fiches-enseignant
router.put('/:id', restrictTo('admin'), salaireController.updateFiche); // /fiches-enseignant

router.post('/generer', restrictTo('admin'), salaireController.genererMois);
router.patch('/:id/payer', restrictTo('admin'), salaireController.payer);
router.patch('/:id/restaurer', restrictTo('admin'), salaireController.restore);
router.delete('/:id', restrictTo('admin'), salaireController.remove);

module.exports = router;
