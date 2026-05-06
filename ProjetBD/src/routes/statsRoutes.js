const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware.protect);

router.get('/overview', statsController.getOverview);
router.get('/notes-by-classe', statsController.getNotesByClasse);
router.get('/notes-by-matiere', statsController.getNotesByMatiere);
router.get('/payments-by-month', statsController.getPaymentsByMonth);
router.get('/payments-by-statut', statsController.getPaymentsByStatut);
router.get('/reussite-by-trimestre', statsController.getReussiteByTrimestre);
router.get('/teachers-recap', statsController.getTeachersRecap);

module.exports = router;
