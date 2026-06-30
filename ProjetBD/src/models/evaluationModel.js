const pool = require('../config/db');

const findAll = async (filters = {}) => {
  let query = `
    SELECT 
      ev.idEval as id, 
      ev.idEval,
      ev.note as valeur, 
      ev.note,
      ev.appreciation as commentaire, 
      ev.appreciation,
      ev.created_at,
      CASE WHEN ev.valider = 1 THEN 'valide' ELSE 'brouillon' END as statut,
      e.prenom as student_prenom, 
      e.nom as student_nom, 
      c.libelle as matiere_nom, 
      c.libelle as libelleCours,
      c.coefficient,
      cl.libelle as classe_nom,
      s.libelle as session_nom,
      s.libelle as libelleSession,
      ne.libelle as libelleNature,
      ep.libelle as libelleEpreuve,
      pers.nom as teacher_nom,
      pers.prenom as teacher_prenom
    FROM Evaluation ev
    LEFT JOIN Eleve e ON ev.matricule = e.matricule
    LEFT JOIN Cours c ON ev.idCours = c.idCours
    LEFT JOIN Session s ON ev.idSession = s.idSession
    LEFT JOIN Trimestre t ON s.idTrimestre = t.idTrimes
    LEFT JOIN Frequente f ON (e.matricule = f.matricule AND f.idAcademi = t.idAca)
    LEFT JOIN Salle sl ON f.idSalle = sl.idSalle
    LEFT JOIN Classe cl ON sl.idClasse = cl.idClasse
    LEFT JOIN Personne pers ON ev.idPers = pers.idPers
    LEFT JOIN Epreuve ep ON ev.idEpreuve = ep.idEpreuve
    LEFT JOIN NatureEpreuve ne ON ep.idNature = ne.idNature
    WHERE ev.isDeleted = ?
  `;
  const params = [filters.isDeleted !== undefined ? filters.isDeleted : 0];

  if (filters.matricule)  { query += ' AND ev.matricule = ?';    params.push(filters.matricule); }
  if (filters.idCours)    { query += ' AND ev.idCours = ?';      params.push(filters.idCours); }
  if (filters.idSession)  { query += ' AND ev.idSession = ?';    params.push(filters.idSession); }
  if (filters.idAnnee)    { query += ' AND ev.idAnnee = ?';      params.push(filters.idAnnee); }
  if (filters.idPers)     { query += ' AND ev.idPers = ?';       params.push(filters.idPers); }
  if (filters.idClasse)   { query += ' AND cl.idClasse = ?';     params.push(filters.idClasse); }

  query += ' ORDER BY ev.created_at DESC';
  const [rows] = await pool.query(query, params);
  return rows;
};

const findById = async (idEval) => {
  const [rows] = await pool.query(`
    SELECT ev.idEval as id, ev.note as valeur, ev.appreciation as commentaire, ev.matricule as student_id, ev.idAnnee
    FROM Evaluation ev WHERE ev.idEval = ? AND ev.isDeleted = 0
  `, [idEval]);
  return rows[0] || null;
};

const create = async (data) => {
  // S'assurer que les IDs sont des entiers ou null
  const matricule  = data.matricule || null;
  const idEpreuve  = parseInt(data.idEpreuve) || null;
  const idCours    = parseInt(data.idCours) || null;
  const idSession  = parseInt(data.idSession) || null;
  const idPers     = parseInt(data.idPers) || null;

  const idAnnee    = parseInt(data.idAnnee) || 1;

  // Validation minimale
  if (!matricule) throw new Error('Matricule élève manquant.');
  if (!idCours)   throw new Error('ID Cours (matière) manquant.');

  const [result] = await pool.query(
    'INSERT INTO Evaluation (note, appreciation, matricule, idEpreuve, idCours, idSession, idPers, idAnnee, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())',
    [
      parseFloat(data.note) || 0, 
      data.appreciation || '', 
      matricule, 
      idEpreuve || 1, // Utiliser 1 (valeur par défaut initialisée)
      idCours, 
      idSession || 1, 
      idPers,
      idAnnee
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
  const [result] = await pool.query('UPDATE Evaluation SET isDeleted = 1 WHERE idEval = ?', [idEval]);
  return result.affectedRows;
};

const restore = async (idEval) => {
  const [result] = await pool.query('UPDATE Evaluation SET isDeleted = 0 WHERE idEval = ?', [idEval]);
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

const destroy = async (idEval) => {
  const [result] = await pool.query('DELETE FROM Evaluation WHERE idEval = ?', [idEval]);
  return result.affectedRows;
};

module.exports = { findAll, findById, create, update, remove, restore, valider, destroy };
