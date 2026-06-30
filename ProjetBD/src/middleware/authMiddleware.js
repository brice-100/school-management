const { verifyToken } = require('../utils/jwtHelper');

/**
 * Vérifie que la requête contient un token JWT valide.
 * Injecte req.user = { id, role, typePersonne } pour les middlewares suivants.
 *
 * Header attendu : Authorization: Bearer <token>
 */
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token manquant ou malformé' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token);
    req.user = decoded; // { id, role, typePersonne, iat, exp }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Session expirée, veuillez vous reconnecter' });
    }
    return res.status(401).json({ message: 'Token invalide' });
  }
};
authMiddleware.protect = authMiddleware;

authMiddleware.restrictTo = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Non authentifié' });
  
  const { userType, role } = req.user;
  
  if (roles.includes('admin') && userType === 'admin') return next();
  if (roles.includes('teacher') && userType === 'personne' && role === 1) return next();
  if (roles.includes('parent') && userType === 'personne' && role === 4) return next();
  if (roles.includes('scolarite') && userType === 'personne' && role === 3) return next();
  if (roles.includes('administratif') && userType === 'personne' && role === 2) return next();
  
  return res.status(403).json({ message: "Vous n'avez pas l'autorisation d'effectuer cette action." });
};

module.exports = authMiddleware;
