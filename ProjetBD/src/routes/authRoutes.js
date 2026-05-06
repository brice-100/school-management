const express        = require('express');
const { body }       = require('express-validator');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const validate       = require('../middleware/validateMiddleware');

const router = express.Router();

/**
 * POST /api/auth/login
 * Connexion — accessible sans token
 */
router.post(
  '/login',
  [
    body('username')
      .trim()
      .notEmpty().withMessage('Le nom d\'utilisateur est requis'),
    body('password')
      .notEmpty().withMessage('Le mot de passe est requis'),
    body('userType')
      .isIn(['admin', 'personne', 'teacher', 'parent']).withMessage('userType doit être "admin", "teacher" ou "parent"'),
  ],
  validate,
  authController.login
);

/**
 * GET /api/auth/me
 * Profil de l'utilisateur connecté — token requis
 */
router.get('/me', authMiddleware, authController.me);

const { handleUpload, uploadNone } = require('../middleware/uploadMiddleware');

/**
 * POST /api/auth/register/teacher
 * Inscription publique enseignant
 */
router.post('/register/teacher', handleUpload(uploadNone), (req, res, next) => {
  req.body.typePersonne = 'teacher';
  next();
}, authController.registerPublic);

/**
 * POST /api/auth/register/parent
 * Inscription publique parent
 */
router.post('/register/parent', handleUpload(uploadNone), (req, res, next) => {
  req.body.typePersonne = 'parent';
  next();
}, authController.registerPublic);

module.exports = router;
