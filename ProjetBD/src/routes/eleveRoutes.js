const express          = require('express');
const { body, param, query } = require('express-validator');
const eleveController  = require('../controllers/eleveController');
const authMiddleware   = require('../middleware/authMiddleware');
const { allowAdmin, allowAny } = require('../middleware/roleMiddleware');
const { handleUpload, uploadPhoto } = require('../middleware/uploadMiddleware');
const validate         = require('../middleware/validateMiddleware');

const router = express.Router();

// Toutes les routes élèves nécessitent un token valide
router.use(authMiddleware);

// ─── Règles de validation réutilisables ──────────────────────
const eleveValidation = [
  body('nom')
    .trim().notEmpty().withMessage('Le nom est obligatoire')
    .isLength({ max: 60 }).withMessage('Le nom ne doit pas dépasser 60 caractères'),
  body('prenom')
    .trim().notEmpty().withMessage('Le prénom est obligatoire')
    .isLength({ max: 60 }).withMessage('Le prénom ne doit pas dépasser 60 caractères'),
  body('dateNaissance')
    .optional({ checkFalsy: true }).isDate().withMessage('Format de date invalide (YYYY-MM-DD)'),
  body('lieuNaissance')
    .optional({ checkFalsy: true }).trim(),
  body('sexe')
    .optional().isIn(['0', '1', '2']).withMessage('sexe : 0=fille, 1=garçon, 2=autre'),
  body('idVilleNaissance')
    .optional({ checkFalsy: true }).isInt({ min: 1 }).withMessage('idVilleNaissance doit être un entier positif'),
];

// ─── Routes ──────────────────────────────────────────────────

/**
 * GET /api/eleves
 * Accessible : admin (tous types) + administratif (typePersonne=2) + scolarité (3)
 */
router.get('/',
  allowAny({ admins: [0, 1, 2, 3], personnes: [1, 2, 3] }),
  [
    query('actif').optional().isIn(['0', '1']).withMessage('actif doit être 0 ou 1'),
    query('idAdmin').optional().isInt({ min: 1 }).withMessage('idAdmin invalide'),
  ],
  validate,
  eleveController.getAll
);

/**
 * GET /api/eleves/classe/:idClasse?idAnnee=1
 * Élèves d'une classe — accessible enseignants aussi
 */
router.get('/classe/:idClasse',
  allowAny({ admins: [0, 1, 2, 3], personnes: [1, 2, 3] }),
  eleveController.getByClasse
);

/**
 * GET /api/eleves/par-cours?idCours=1
 */
router.get('/par-cours',
  allowAny({ admins: [0, 1, 2, 3], personnes: [1, 2, 3] }),
  eleveController.getByCours
);

/**
 * GET /api/eleves/:matricule
 * Détail d'un élève
 */
router.get('/:matricule',
  allowAny({ admins: [0, 1, 2, 3], personnes: [1, 2, 3, 4] }),
  [param('matricule').notEmpty().withMessage('Matricule requis')],
  validate,
  eleveController.getOne
);

/**
 * GET /api/eleves/:matricule/fiche
 * Dossier complet d'un élève (Admin)
 */
router.get('/:matricule/fiche',
  allowAny({ admins: [0, 1, 2, 3] }),
  [param('matricule').notEmpty().withMessage('Matricule requis')],
  validate,
  eleveController.getFiche
);

/**
 * POST /api/eleves
 * Créer un élève — réservé admin + scolarité
 */
router.post('/',
  allowAny({ admins: [0, 1, 3], personnes: [3] }),
  handleUpload(uploadPhoto),
  eleveValidation,
  validate,
  eleveController.create
);

/**
 * PUT /api/eleves/:matricule
 * Modifier un élève — réservé admin + scolarité
 */
router.put('/:matricule',
  allowAny({ admins: [0, 1, 3], personnes: [3] }),
  handleUpload(uploadPhoto),
  [
    param('matricule').notEmpty().withMessage('Matricule requis'),
    ...eleveValidation,
  ],
  validate,
  eleveController.update
);

/**
 * PATCH /api/eleves/:matricule/statut
 * Activer / désactiver un élève
 */
router.patch('/:matricule/statut',
  allowAny({ admins: [0, 1, 3], personnes: [3] }),
  [
    param('matricule').notEmpty().withMessage('Matricule requis'),
    body('actif').isIn([0, 1]).withMessage('actif doit être 0 ou 1'),
  ],
  validate,
  eleveController.updateStatut
);

/**
 * DELETE /api/eleves/:matricule
 * Suppression définitive — réservé root et admin uniquement
 */
router.delete('/:matricule',
  allowAdmin(0, 1),
  [param('matricule').notEmpty().withMessage('Matricule requis')],
  validate,
  eleveController.remove
);

/**
 * DELETE /api/eleves/:matricule/hard
 * Suppression définitive — réservé root et admin uniquement
 */
router.delete('/:matricule/hard',
  allowAdmin(0, 1),
  [param('matricule').notEmpty().withMessage('Matricule requis')],
  validate,
  eleveController.hardRemove
);

/**
 * PATCH /api/eleves/:matricule/restaurer
 * Restaure un élève archivé — réservé admin
 */
router.patch('/:matricule/restaurer',
  allowAdmin(0, 1),
  [param('matricule').notEmpty().withMessage('Matricule requis')],
  validate,
  eleveController.restore
);

module.exports = router;
