const pool = require('../config/db');

const findAll = async (filters = {}) => {
  let query = 'SELECT * FROM Trimestre WHERE 1=1';
  const params = [];
  if (filters.idAca) {
    query += ' AND idAca = ?';
    params.push(filters.idAca);
  }
  query += ' ORDER BY idTrimes ASC';
  const [rows] = await pool.query(query, params);
  return rows;
};

const findById = async (idTrimes) => {
  const [rows] = await pool.query('SELECT * FROM Trimestre WHERE idTrimes = ?', [idTrimes]);
  return rows[0] || null;
};

const create = async (data) => {
  const [result] = await pool.query(
    'INSERT INTO Trimestre (libelle, periode, idAca, idAdmin) VALUES (?, ?, ?, ?)',
    [data.libelle, data.periode || '', data.idAca, data.idAdmin]
  );
  return result.insertId;
};

const update = async (idTrimes, data) => {
  const [result] = await pool.query(
    'UPDATE Trimestre SET libelle = ?, periode = ?, idAca = ? WHERE idTrimes = ?',
    [data.libelle, data.periode, data.idAca, idTrimes]
  );
  return result.affectedRows;
};

const remove = async (idTrimes) => {
  const [result] = await pool.query('DELETE FROM Trimestre WHERE idTrimes = ?', [idTrimes]);
  return result.affectedRows;
};

module.exports = { findAll, findById, create, update, remove };
