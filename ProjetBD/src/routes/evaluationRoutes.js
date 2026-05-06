const express = require('express');
const router = express.Router();
const evaluationController = require('../controllers/evaluationController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', evaluationController.getAll);
router.get('/classe', evaluationController.getClasse);
router.get('/:id', evaluationController.getOne);

router.use(restrictTo('admin', 'teacher'));
router.post('/', evaluationController.create);
router.put('/:id', evaluationController.update);
router.delete('/:id', evaluationController.remove);

module.exports = router;
