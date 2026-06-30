const pool = require('../config/db');

const findAll = async (filters = {}) => {
  let query = `
    SELECT co.*, c.libelle as classe_nom 
    FROM Cours co
    LEFT JOIN Classe c ON co.idClasse = c.idClasse
    WHERE co.isDeleted = ?
  `;
  const params = [filters.isDeleted !== undefined ? filters.isDeleted : 0];
  if (filters.actif !== undefined) {
    query += ' AND co.actif = ?';
    params.push(filters.actif);
  }
  if (filters.idAnnee !== undefined) {
    query += ' AND co.idAnnee = ?';
    params.push(filters.idAnnee);
  }
  query += ' ORDER BY co.libelle ASC';
  const [rows] = await pool.query(query, params);
  return rows;
};

const findMesCours = async (idPers, idAnnee = null) => {
  let query = `
    SELECT DISTINCT c.*, cl.libelle AS classe_nom
    FROM Cours c
    JOIN Enseignant e ON e.idPers = ?
    LEFT JOIN Classe cl ON c.idClasse = cl.idClasse
    WHERE c.actif = 1
      AND (
        c.idCours = e.idCours
        OR c.idCours IN (
          SELECT tm.matiere_id
          FROM teacher_matieres tm
          WHERE tm.teacher_id = e.idEnseignant
        )
      )
  `;
  const params = [idPers];
  if (idAnnee) {
    query += ' AND c.idAnnee = ?';
    params.push(idAnnee);
  }
  query += ' ORDER BY c.libelle ASC';
  const [rows] = await pool.query(query, params);
  return rows;
};

/**
 * Retourne les matières groupées par libellé (sans doublons).
 * Chaque entrée contient :
 *   - idCours       : le premier idCours du groupe (référence principale)
 *   - libelle, coefficient, description
 *   - ids           : tous les idCours partageant ce libellé [Number[]]
 *   - classes_noms  : noms des classes séparés par ", "
 *   - classes_ids   : liste des idClasse associés [Number[]]
 */
const findGrouped = async () => {
  const [rows] = await pool.query(`
    SELECT
      MIN(co.idCours) AS idCours,
      MAX(co.libelle) AS libelle,
      MAX(co.coefficient) AS coefficient,
      MAX(co.description) AS description,
      GROUP_CONCAT(DISTINCT co.idCours ORDER BY co.idCours) AS ids,
      GROUP_CONCAT(DISTINCT c.libelle  ORDER BY c.libelle  SEPARATOR ', ') AS classes_noms,
      GROUP_CONCAT(DISTINCT co.idClasse ORDER BY co.idClasse) AS classes_ids
    FROM Cours co
    LEFT JOIN Classe c ON co.idClasse = c.idClasse
    WHERE co.isDeleted = 0
    GROUP BY LOWER(TRIM(co.libelle))
    ORDER BY MAX(co.libelle) ASC
  `);
  return rows.map(r => ({
    ...r,
    ids:         r.ids         ? r.ids.split(',').map(Number)         : [r.idCours],
    classes_ids: r.classes_ids ? r.classes_ids.split(',').map(Number) : [],
  }));
};

const findById = async (idCours) => {
  const [rows] = await pool.query('SELECT * FROM Cours WHERE idCours = ? AND isDeleted = 0', [idCours]);
  return rows[0] || null;
};

const create = async (data) => {
  const [result] = await pool.query(
    'INSERT INTO Cours (libelle, note, coefficient, description, idClasse, idAdmin, actif, idAnnee, created_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?, NOW())',
    [data.libelle, data.note || 0, data.coefficient || 1, data.description || '', data.idClasse || 1, data.idAdmin, data.idAnnee]
  );
  return result.insertId;
};

const update = async (idCours, data) => {
  const [result] = await pool.query(
    'UPDATE Cours SET libelle = ?, note = ?, coefficient = ?, description = ?, idClasse = ? WHERE idCours = ?',
    [data.libelle, data.note, data.coefficient, data.description, data.idClasse, idCours]
  );
  return result.affectedRows;
};

const setActif = async (idCours, actif) => {
  const [result] = await pool.query('UPDATE Cours SET actif = ? WHERE idCours = ?', [actif, idCours]);
  return result.affectedRows;
};

const remove = async (idCours) => {
  const [result] = await pool.query('UPDATE Cours SET isDeleted = 1 WHERE idCours = ?', [idCours]);
  return result.affectedRows;
};

const restore = async (idCours) => {
  const [result] = await pool.query('UPDATE Cours SET isDeleted = 0 WHERE idCours = ?', [idCours]);
  return result.affectedRows;
};

const findElevesParCours = async (idCours) => {
  const [rows] = await pool.query(`
    SELECT e.matricule, e.nom, e.prenom
    FROM Eleve e
    JOIN Frequente f ON e.matricule = f.matricule
    JOIN Salle s ON f.idSalle = s.idSalle
    JOIN Cours c ON s.idClasse = c.idClasse
    WHERE c.idCours = ? AND e.actif = 1
    GROUP BY e.matricule
  `, [idCours]);
  return rows;
};

module.exports = { findAll, findMesCours, findGrouped, findById, create, update, setActif, remove, restore, findElevesParCours };
