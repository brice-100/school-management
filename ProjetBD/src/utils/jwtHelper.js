const jwt = require('jsonwebtoken');

const SECRET      = process.env.JWT_SECRET ;
const EXPIRES_IN  = process.env.JWT_EXPIRES_IN ;

if (!SECRET) {
  throw new Error('❌ JWT_SECRET manquant dans les variables d\'environnement');
}

/**
 * Génère un token JWT.
 * @param {object} payload  - Données à encoder (id, role, etc.)
 * @returns {string}          Token signé
 */
const generateToken = (payload) => {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });
};

/**
 * Vérifie et décode un token JWT.
 * @param {string} token
 * @returns {object}  Payload décodé
 * @throws  {Error}   Si le token est invalide ou expiré
 */
const verifyToken = (token) => {
  return jwt.verify(token, SECRET);
};

module.exports = { generateToken, verifyToken };
