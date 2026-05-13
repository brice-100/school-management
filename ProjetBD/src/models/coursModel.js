const pool = require('../config/db');

const findAll = async (filters = {}) => {
  let query = `
    SELECT co.*, c.libelle as classe_nom 
    FROM Cours co
    LEFT JOIN Classe c ON co.idClasse = c.idClasse
    WHERE 1=1
  `;
  const params = [];
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

const findMesCours = async (idPers) => {
  const [rows] = await pool.query(`
    SELECT c.*, cl.libelle as classe_nom
    FROM Cours c
    JOIN Enseignant e ON c.idCours = e.idCours
    LEFT JOIN Classe cl ON c.idClasse = cl.idClasse
    WHERE e.idPers = ? AND c.actif = 1
  `, [idPers]);
  return rows;
};

const findById = async (idCours) => {
  const [rows] = await pool.query('SELECT * FROM Cours WHERE idCours = ?', [idCours]);
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
  const [result] = await pool.query('DELETE FROM Cours WHERE idCours = ?', [idCours]);
  return result.affectedRows;
};

module.exports = { findAll, findById, create, update, setActif, remove };
