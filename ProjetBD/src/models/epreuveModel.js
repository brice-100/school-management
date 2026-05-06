const pool = require('../config/db');

const findAll = async (filters = {}) => {
  let query = 'SELECT e.*, n.libelle as nature_nom FROM Epreuve e LEFT JOIN NatureEpreuve n ON e.idNature = n.idNature WHERE 1=1';
  const params = [];
  if (filters.idNature) {
    query += ' AND e.idNature = ?';
    params.push(filters.idNature);
  }
  query += ' ORDER BY e.idEpreuve DESC';
  const [rows] = await pool.query(query, params);
  return rows;
};

const findById = async (idEpreuve) => {
  const [rows] = await pool.query('SELECT * FROM Epreuve WHERE idEpreuve = ?', [idEpreuve]);
  return rows[0] || null;
};

const create = async (data) => {
  const [result] = await pool.query(
    'INSERT INTO Epreuve (libelle, urlDoc, auteur, idNature, idPers, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
    [data.libelle, data.urlDoc || '', data.auteur || '', data.idNature, data.idPers]
  );
  return result.insertId;
};

const update = async (idEpreuve, data) => {
  const [result] = await pool.query(
    'UPDATE Epreuve SET libelle = ?, urlDoc = ?, auteur = ?, idNature = ? WHERE idEpreuve = ?',
    [data.libelle, data.urlDoc, data.auteur, data.idNature, idEpreuve]
  );
  return result.affectedRows;
};

const remove = async (idEpreuve) => {
  const [result] = await pool.query('DELETE FROM Epreuve WHERE idEpreuve = ?', [idEpreuve]);
  return result.affectedRows;
};

module.exports = { findAll, findById, create, update, remove };
