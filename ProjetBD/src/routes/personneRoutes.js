const express = require('express');
const router = express.Router();
const personneController = require('../controllers/personneController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware.protect);

router.get('/', personneController.getPersonnes);
router.patch('/:id/statut', personneController.updateStatut);
router.delete('/:id', personneController.deletePersonne);

module.exports = router;
