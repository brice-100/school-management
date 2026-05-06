const express = require('express');
const router = express.Router();
const rapportController = require('../controllers/rapportController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', rapportController.getRapports);
router.get('/cours', rapportController.getRapportsCours);
router.post('/', rapportController.createRapport);
router.put('/:id', rapportController.updateRapport);

module.exports = router;
