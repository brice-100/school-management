const pool = require('../config/db');

const findAll = async (filters = {}) => {
  let query = `
    SELECT s.*, t.libelle as trimestre_nom
    FROM Session s
    LEFT JOIN Trimestre t ON s.idTrimestre = t.idTrimes
    WHERE 1=1
  `;
  const params = [];
  if (filters.idTrimestre) {
    query += ' AND s.idTrimestre = ?';
    params.push(filters.idTrimestre);
  }
  query += ' ORDER BY s.idSession DESC';
  const [rows] = await pool.query(query, params);
  return rows;
};

const findById = async (idSession) => {
  const [rows] = await pool.query(
    'SELECT s.*, t.libelle as trimestre_nom FROM Session s LEFT JOIN Trimestre t ON s.idTrimestre = t.idTrimes WHERE s.idSession = ?',
    [idSession]
  );
  return rows[0] || null;
};

const create = async (data) => {
  const [result] = await pool.query(
    'INSERT INTO Session (libelle, description, idTrimestre, idPers, date_passage, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
    [data.libelle, data.description || '', data.idTrimestre, data.idPers, data.date_passage || null]
  );
  return result.insertId;
};

const update = async (idSession, data) => {
  const [result] = await pool.query(
    'UPDATE Session SET libelle = ?, description = ?, idTrimestre = ?, date_passage = ? WHERE idSession = ?',
    [data.libelle, data.description, data.idTrimestre, data.date_passage || null, idSession]
  );
  return result.affectedRows;
};

const remove = async (idSession) => {
  const [result] = await pool.query('DELETE FROM Session WHERE idSession = ?', [idSession]);
  return result.affectedRows;
};

module.exports = { findAll, findById, create, update, remove };
