const pool = require('../config/db');

const findAll = async (filters = {}) => {
  let query = `
    SELECT 
      ev.idEval as id, ev.note as valeur, ev.appreciation as commentaire, ev.created_at,
      CASE WHEN ev.valider = 1 THEN 'valide' ELSE 'brouillon' END as statut,
      e.prenom as student_prenom, e.nom as student_nom, 
      c.libelle as matiere_nom, 
      cl.libelle as classe_nom,
      s.libelle as session_nom 
    FROM evaluation ev
    LEFT JOIN Eleve e ON ev.matricule = e.matricule
    LEFT JOIN Cours c ON ev.idCours = c.idCours
    LEFT JOIN Session s ON ev.idSession = s.idSession
    LEFT JOIN Trimestre t ON s.idTrimestre = t.idTrimes
    LEFT JOIN Frequente f ON (e.matricule = f.matricule AND f.idAcademi = t.idAca)
    LEFT JOIN Salle sl ON f.idSalle = sl.idSalle
    LEFT JOIN Classe cl ON sl.idClasse = cl.idClasse
    WHERE 1=1
  `;
  const params = [];
  
  if (filters.matricule) { query += ' AND ev.matricule = ?'; params.push(filters.matricule); }
  if (filters.idCours) { query += ' AND ev.idCours = ?'; params.push(filters.idCours); }
  if (filters.idSession) { query += ' AND ev.idSession = ?'; params.push(filters.idSession); }
  
  query += ' ORDER BY ev.created_at DESC';
  const [rows] = await pool.query(query, params);
  return rows;
};

const findById = async (idEval) => {
  const [rows] = await pool.query(`
    SELECT ev.idEval as id, ev.note as valeur, ev.appreciation as commentaire, ev.matricule as student_id
    FROM Evaluation WHERE idEval = ?
  `, [idEval]);
  return rows[0] || null;
};

const create = async (data) => {
  // S'assurer que les IDs sont des entiers ou null
  const matricule  = parseInt(data.matricule) || null;
  const idEpreuve  = parseInt(data.idEpreuve) || null;
  const idCours    = parseInt(data.idCours) || null;
  const idSession  = parseInt(data.idSession) || null;
  const idPers     = parseInt(data.idPers) || null;

  // Validation minimale
  if (!matricule) throw new Error('Matricule élève manquant.');
  if (!idCours)   throw new Error('ID Cours (matière) manquant.');

  const [result] = await pool.query(
    'INSERT INTO Evaluation (note, appreciation, matricule, idEpreuve, idCours, idSession, idPers, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
    [
      parseFloat(data.note) || 0, 
      data.appreciation || '', 
      matricule, 
      idEpreuve || 1, // Utiliser 1 (valeur par défaut initialisée)
      idCours, 
      idSession || 1, 
      idPers
    ]
  );
  return result.insertId;
};

const update = async (idEval, data) => {
  const [result] = await pool.query(
    'UPDATE Evaluation SET note = ?, appreciation = ?, matricule = ?, idEpreuve = ?, idCours = ?, idSession = ? WHERE idEval = ?',
    [data.note, data.appreciation, data.matricule, data.idEpreuve, data.idCours, data.idSession, idEval]
  );
  return result.affectedRows;
};

const remove = async (idEval) => {
  const [result] = await pool.query('DELETE FROM Evaluation WHERE idEval = ?', [idEval]);
  return result.affectedRows;
};

const valider = async (ids) => {
  if (!ids || ids.length === 0) return 0;
  const [result] = await pool.query(
    'UPDATE Evaluation SET valider = 1 WHERE idEval IN (?)',
    [ids]
  );
  return result.affectedRows;
};

module.exports = { findAll, findById, create, update, remove, valider };
