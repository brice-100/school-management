/**
 * Wrapper pour éviter les try/catch répétitifs dans chaque controller.
 * Toute erreur levée dans fn() est transmise au middleware d'erreur global.
 *
 * Usage :
 *   router.get('/route', asyncHandler(async (req, res) => { ... }));
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
