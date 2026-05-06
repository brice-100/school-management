const express = require('express');
const router = express.Router();
const enseignantSalaireController = require('../controllers/enseignantSalaireController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware.protect);

router.get('/', enseignantSalaireController.getSalaireHistorique);
router.get('/statut', enseignantSalaireController.getSalaireStatut);
router.post('/decaissement', enseignantSalaireController.demanderDecaissement);

module.exports = router;
