const express = require('express');
const router = express.Router();
const paiementController = require('../controllers/paiementController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

router.use(protect);

// Routes GET
router.get('/mon-compte',  paiementController.getParentPaiements);
router.get('/summary',     paiementController.getSummary);
router.get('/recents',     restrictTo('admin'), paiementController.getRecents);
router.get('/',            restrictTo('admin'), paiementController.getAll);
router.get('/:id',         paiementController.getOne);

// Routes POST
router.post('/initier',    paiementController.initier);                          // parent
router.post('/',           restrictTo('admin', 'parent'), paiementController.create); // admin

// Routes PATCH
router.patch('/:id/valider', restrictTo('admin'), paiementController.valider);
router.patch('/:id/restaurer', restrictTo('admin'), paiementController.restore);

// Routes DELETE
router.delete('/:id', restrictTo('admin'), paiementController.remove);

module.exports = router;
