/**
 * Deux types d'utilisateurs coexistent dans l'app :
 *
 *  - Admin      → table Admin      → typeAdmin :  0=root, 1=admin, 2=fondateur, 3=directeur
 *  - Personne   → table Personne   → typePersonne: 1=enseignant, 2=administratif,
 *                                                  3=scolarité, 4=parent
 *
 * Le payload JWT doit contenir :
 *   { id, userType: 'admin'|'personne', role: <typeAdmin ou typePersonne> }
 */

/**
 * Autorise uniquement les Admins dont le typeAdmin est dans la liste allowedTypes.
 *
 * Usage : router.get('/route', authMiddleware, allowAdmin(0, 1), controller)
 * @param  {...number} allowedTypes  typeAdmin autorisés
 */
const allowAdmin = (...allowedTypes) => (req, res, next) => {
  const isSuperAdmin = req.user?.role === 0;
  if (req.user?.userType !== 'admin' && !isSuperAdmin) {
    return res.status(403).json({ message: 'Accès réservé aux administrateurs' });
  }
  const userRole = Number(req.user.role);
  if (!allowedTypes.includes(userRole)) {
    return res.status(403).json({ message: 'Vous n\'avez pas les droits suffisants' });
  }
  next();
};

/**
 * Autorise uniquement les Personnes dont le typePersonne est dans la liste allowedTypes.
 *
 * Usage : router.get('/route', authMiddleware, allowPersonne(1, 2), controller)
 * @param  {...number} allowedTypes  typePersonne autorisés
 */
const allowPersonne = (...allowedTypes) => (req, res, next) => {
  if (req.user?.userType !== 'personne') {
    return res.status(403).json({ message: 'Accès réservé aux utilisateurs Personne' });
  }
  const userRole = Number(req.user.role);
  if (!allowedTypes.includes(userRole)) {
    return res.status(403).json({ message: 'Vous n\'avez pas les droits suffisants' });
  }
  next();
};

/**
 * Autorise à la fois des Admins ET des Personnes selon leurs types respectifs.
 * Utile pour les routes accessibles à plusieurs profils mixtes.
 *
 * Usage :
 *   allowAny({ admins: [0, 1], personnes: [1, 2] })
 *
 * @param {{ admins?: number[], personnes?: number[] }} rules
 */
const allowAny = ({ admins = [], personnes = [] }) => (req, res, next) => {
  const { userType, role } = req.user || {};
  const userRole = Number(role);

  const isSuperAdmin = userRole === 0;

  if ((userType === 'admin' || (!userType && isSuperAdmin)) && admins.includes(userRole)) return next();
  if (userType === 'personne' && personnes.includes(userRole)) return next();

  return res.status(403).json({ message: 'Accès non autorisé' });
};

module.exports = { allowAdmin, allowPersonne, allowAny };
