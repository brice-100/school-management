const express = require('express');
const router = express.Router();
const planningController = require('../controllers/planningController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/form-data', planningController.getFormData);
router.get('/classe/:id', planningController.getByClasse);
router.get('/teacher/:id', planningController.getByTeacher);
router.get('/mine', planningController.getMine);
router.get('/', planningController.getAll);

// Routes supplémentaires pour /emploi-du-temps
router.get('/enseignant', planningController.getByTeacher);
router.get('/eleve', planningController.getByClasse);
router.get('/jours-semaine', planningController.getJoursSemaine);

router.use(restrictTo('admin', 'teacher'));
router.post('/', planningController.create);
router.put('/:id', planningController.update);
router.delete('/:id', planningController.remove);

module.exports = router;
