const pool = require('../config/db');

const findAll = async () => {
  const [rows] = await pool.query('SELECT * FROM Mode ORDER BY idMode ASC');
  return rows;
};

const findById = async (idMode) => {
  const [rows] = await pool.query('SELECT * FROM Mode WHERE idMode = ?', [idMode]);
  return rows[0] || null;
};

const create = async (data) => {
  const [result] = await pool.query(
    'INSERT INTO Mode (libelle, information, actif, idFondateur, created_at) VALUES (?, ?, 1, ?, NOW())',
    [data.libelle, data.information || '', data.idFondateur]
  );
  return result.insertId;
};

const update = async (idMode, data) => {
  const fields = [];
  const params = [];
  
  if (data.libelle !== undefined) { fields.push('libelle = ?'); params.push(data.libelle); }
  if (data.information !== undefined) { fields.push('information = ?'); params.push(data.information); }
  if (data.actif !== undefined) { fields.push('actif = ?'); params.push(data.actif); }

  if (fields.length === 0) return 0;
  
  params.push(idMode);
  const [result] = await pool.query(`UPDATE Mode SET ${fields.join(', ')} WHERE idMode = ?`, params);
  return result.affectedRows;
};

module.exports = { findAll, findById, create, update };
