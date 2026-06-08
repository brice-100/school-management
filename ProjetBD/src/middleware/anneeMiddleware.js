const pool = require('../config/db');

/**
 * Middleware pour injecter l'ID de l'année académique active ou sélectionnée
 */
const injectAnnee = async (req, res, next) => {
  let idAnnee;
  
  // 1. Priorité à ce qui est passé en paramètre
  if (req.query.idAnnee || req.body.idAnnee) {
    idAnnee = parseInt(req.query.idAnnee || req.body.idAnnee);
  } else {
    // 2. Sinon, on cherche l'année active dans la BD
    try {
      const [rows] = await pool.query('SELECT idAnnee FROM AnneeAcademique WHERE est_active = 1 LIMIT 1');
      idAnnee = rows[0] ? rows[0].idAnnee : 1;
    } catch (err1) {
      try {
        const [rows] = await pool.query('SELECT idAnnee FROM anneeacademique WHERE est_active = 1 LIMIT 1');
        idAnnee = rows[0] ? rows[0].idAnnee : 1;
      } catch (err2) {
        console.error('Erreur anneeMiddleware:', err1.message, '|', err2.message);
        idAnnee = 1;
      }
    }
  }

  // Injecter dans req pour usage interne
  req.idAnnee = idAnnee;
  
  // Injecter dans query/body pour les contrôleurs qui lisent directement là-dedans
  if (req.method === 'GET' && !req.query.idAnnee) {
    req.query.idAnnee = idAnnee;
  }
  if ((req.method === 'POST' || req.method === 'PUT') && !req.body.idAnnee) {
    req.body.idAnnee = idAnnee;
  }
  
  next();
};

module.exports = { injectAnnee };
