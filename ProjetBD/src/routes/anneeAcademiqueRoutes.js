const express = require('express');
const router = express.Router();
const anneeAcademiqueController = require('../controllers/anneeAcademiqueController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', anneeAcademiqueController.getAll);
router.get('/active', anneeAcademiqueController.getActive);
router.get('/:id', anneeAcademiqueController.getOne);

router.use(restrictTo('admin'));
router.put('/:id/active', anneeAcademiqueController.setActive);
router.post('/', anneeAcademiqueController.create);
router.put('/:id', anneeAcademiqueController.update);
router.delete('/:id', anneeAcademiqueController.remove);

module.exports = router;
