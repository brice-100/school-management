const pool = require('../config/db');

const findAll = async (filters = {}) => {
  let query = `
    SELECT p.*, 
      p.heure_debut, p.heure_fin,
      c.libelle as classe_nom, 
      cr.libelle as matiere_nom,
      s.libelle as salle_nom,
      pers.nom as teacher_nom,
      pers.prenom as teacher_prenom
    FROM EmploiDuTemps p
    LEFT JOIN Classe c ON p.idClasse = c.idClasse
    LEFT JOIN Cours cr ON p.idCours = cr.idCours
    LEFT JOIN Salle s ON p.idSalle = s.idSalle
    LEFT JOIN Enseignant e ON p.idEnseignant = e.idEnseignant
    LEFT JOIN Personne pers ON e.idPers = pers.idPers
  `;
  const params = [];
  
  if (filters.idPers) {
    // Si c'est un enseignant, on filtre par son idPers
    query += ' WHERE e.idPers = ?';
    params.push(filters.idPers);
  } else {
    query += ' WHERE 1=1';
  }
  
  if (filters.idClasse) { query += ' AND p.idClasse = ?'; params.push(filters.idClasse); }
  if (filters.idCours) { query += ' AND p.idCours = ?'; params.push(filters.idCours); }
  if (filters.idAnnee) { query += ' AND p.idAnnee = ?'; params.push(filters.idAnnee); }
  
  query += ' ORDER BY p.jour ASC, p.heure_debut ASC';
  const [rows] = await pool.query(query, params);
  return rows;
};

const findById = async (idTemps) => {
  const [rows] = await pool.query('SELECT * FROM EmploiDuTemps WHERE idTemps = ?', [idTemps]);
  return rows[0] || null;
};

const create = async (data) => {
  const [result] = await pool.query(
    'INSERT INTO EmploiDuTemps (jour, heure_debut, heure_fin, idClasse, idCours, idEnseignant, idSalle, idAdmin, idAnnee, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())',
    [data.jour, data.heure_debut, data.heure_fin, data.idClasse, data.idCours, data.idEnseignant, data.idSalle, data.idAdmin, data.idAnnee || 1]
  );
  return result.insertId;
};

const update = async (idTemps, data) => {
  const [result] = await pool.query(
    'UPDATE EmploiDuTemps SET jour = ?, heure_debut = ?, heure_fin = ?, idClasse = ?, idCours = ?, idEnseignant = ?, idSalle = ? WHERE idTemps = ?',
    [data.jour, data.heure_debut, data.heure_fin, data.idClasse, data.idCours, data.idEnseignant, data.idSalle, idTemps]
  );
  return result.affectedRows;
};

const remove = async (idTemps) => {
  const [result] = await pool.query('DELETE FROM EmploiDuTemps WHERE idTemps = ?', [idTemps]);
  return result.affectedRows;
};

module.exports = { findAll, findById, create, update, remove };
