const express = require('express');
const router = express.Router();
const personneController = require('../controllers/personneController');
const authMiddleware = require('../middleware/authMiddleware');
const { allowAdmin } = require('../middleware/roleMiddleware');

router.use(authMiddleware.protect);

router.get('/', personneController.getPersonnes);
router.patch('/:id/statut', allowAdmin(0), personneController.updateStatut);
router.delete('/:id', allowAdmin(0), personneController.deletePersonne);

module.exports = router;
