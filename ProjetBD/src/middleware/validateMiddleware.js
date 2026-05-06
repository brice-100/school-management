const { validationResult } = require('express-validator');

/**
 * À placer EN FIN de chaîne de validation, juste avant le controller.
 * Si des erreurs de validation existent, renvoie un 422 avec le détail.
 * Sinon, passe au controller.
 *
 * Usage :
 *   router.post(
 *     '/route',
 *     [body('nom').notEmpty(), body('email').isEmail()],
 *     validate,
 *     monController
 *   );
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).json({
      message: 'Données invalides',
      errors: errors.array().map(e => ({
        champ:   e.path,
        message: e.msg,
        valeur:  e.value,
      })),
    });
  }

  next();
};

module.exports = validate;
