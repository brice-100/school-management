const express               = require('express');
const { body, param }       = require('express-validator');
const enseignantController  = require('../controllers/enseignantController');
const authMiddleware        = require('../middleware/authMiddleware');
const { allowAdmin, allowAny } = require('../middleware/roleMiddleware');
const validate              = require('../middleware/validateMiddleware');
const { handleUpload, uploadPhoto } = require('../middleware/uploadMiddleware');

const router = express.Router();

// Token requis sur toutes les routes
router.use(authMiddleware);

// ─── Règles de validation réutilisables ──────────────────────
const enseignantValidation = [
  body('nom')
    .trim().notEmpty().withMessage('Le nom est obligatoire'),
  body('prenom')
    .trim().notEmpty().withMessage('Le prénom est obligatoire'),
  body('dateNaissance')
    .optional({ checkFalsy: true })
    .isDate().withMessage('Format de date invalide (YYYY-MM-DD)'),
  body('lieuNaissance')
    .optional({ checkFalsy: true }),
  body('mobile')
    .optional()
    .isLength({ max: 15 }).withMessage('Mobile max 15 caractères'),
  body('idCours')
    .optional({ checkFalsy: true }),
];

const createValidation = [
  ...enseignantValidation,
  body('username')
    .trim().notEmpty().withMessage('Le nom d\'utilisateur est obligatoire'),
  body('password')
    .optional()
    .isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères'),
  body('mot_de_passe')
    .optional()
    .isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères'),
];

// ─── Routes ──────────────────────────────────────────────────

/**
 * GET /api/enseignants
 * Accessible : admin (tous) + administratif + scolarité
 */
router.get('/',
  allowAny({ admins: [0, 1, 2, 3], personnes: [1, 2, 3, 4] }),
  enseignantController.getAll
);

/**
 * GET /api/enseignants/:idEnseignant
 */
router.get('/:idEnseignant',
  allowAny({ admins: [0, 1, 2, 3], personnes: [1, 2, 3] }),
  [param('idEnseignant').isInt({ min: 1 }).withMessage('idEnseignant invalide')],
  validate,
  enseignantController.getOne
);

/**
 * POST /api/enseignants
 * Réservé admin + directeur
 */
router.post('/',
  allowAdmin(0),
  handleUpload(uploadPhoto),
  createValidation,
  validate,
  enseignantController.create
);

/**
 * PUT /api/enseignants/:idEnseignant
 * Modifier les infos d'un enseignant
 */
router.put('/:idEnseignant',
  allowAdmin(0, 1, 3),
  handleUpload(uploadPhoto),
  [
    param('idEnseignant').isInt({ min: 1 }).withMessage('idEnseignant invalide'),
    ...enseignantValidation,
  ],
  validate,
  enseignantController.update
);

/**
 * PATCH /api/enseignants/:idEnseignant/statut
 * Activer / désactiver un enseignant
 */
router.patch('/:idEnseignant/statut',
  allowAdmin(0),
  [
    param('idEnseignant').isInt({ min: 1 }).withMessage('idEnseignant invalide'),
    body('actif').isIn([0, 1]).withMessage('actif doit être 0 ou 1'),
  ],
  validate,
  enseignantController.updateStatut
);

/**
 * PATCH /api/enseignants/:idEnseignant/password
 * Changer le mot de passe d'un enseignant
 */
router.patch('/:idEnseignant/password',
  allowAdmin(0),
  [
    param('idEnseignant').isInt({ min: 1 }).withMessage('idEnseignant invalide'),
    body('newPassword')
      .notEmpty().withMessage('Le nouveau mot de passe est obligatoire')
      .isLength({ min: 6 }).withMessage('Minimum 6 caractères'),
  ],
  validate,
  enseignantController.updatePassword
);

/**
 * GET /api/enseignants/:idEnseignant/eleves
 * Liste des élèves des classes où enseigne cet enseignant
 * Accessible : admin + enseignant concerné
 */
router.get('/:idEnseignant/eleves',
  allowAny({ admins: [0, 1, 2, 3], personnes: [1, 2, 3] }),
  [param('idEnseignant').isInt({ min: 1 }).withMessage('idEnseignant invalide')],
  validate,
  enseignantController.getElevesEnseignant
);

/**
 * DELETE /api/enseignants/:idEnseignant
 * Suppression définitive — root/admin uniquement
 */
router.delete('/:idEnseignant',
  allowAdmin(0),
  [param('idEnseignant').isInt({ min: 1 }).withMessage('idEnseignant invalide')],
  validate,
  enseignantController.remove
);

/**
 * PATCH /api/enseignants/:idEnseignant/restaurer
 */
router.patch('/:idEnseignant/restaurer',
  allowAdmin(0),
  [param('idEnseignant').isInt({ min: 1 }).withMessage('idEnseignant invalide')],
  validate,
  enseignantController.restore
);

/**
 * DELETE /api/enseignants/:idEnseignant/hard
 * Suppression définitive — root/admin uniquement
 */
router.delete('/:idEnseignant/hard',
  allowAdmin(0),
  [param('idEnseignant').isInt({ min: 1 }).withMessage('idEnseignant invalide')],
  validate,
  enseignantController.hardRemove
);

module.exports = router;
