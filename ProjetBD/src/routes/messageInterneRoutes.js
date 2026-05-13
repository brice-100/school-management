const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/messageInterneController');
const authMiddleware = require('../middleware/authMiddleware');
const { allowAdmin, allowPersonne, allowAny } = require('../middleware/roleMiddleware');

// Token requis sur toutes les routes
router.use(authMiddleware);

// Lire les messages — admin voit tout, enseignant voit les siens
router.get('/',
  allowAny({ admins: [0, 1, 2, 3], personnes: [1] }),
  ctrl.getAll
);

router.get('/:id',
  allowAny({ admins: [0, 1, 2, 3], personnes: [1] }),
  ctrl.getOne
);

// Créer un message — enseignants uniquement
router.post('/',
  allowPersonne(1),
  ctrl.create
);

// Répondre à un message — admin uniquement
router.post('/:id/repondre',
  allowAdmin(0, 1, 2, 3),
  ctrl.repondre
);

// Marquer comme lu — admin uniquement
router.patch('/:id/lu',
  allowAdmin(0, 1, 2, 3),
  ctrl.markAsLu
);

// Supprimer
router.delete('/:id',
  allowAdmin(0, 1),
  ctrl.remove
);

module.exports = router;
