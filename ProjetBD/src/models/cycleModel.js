const pool = require('../config/db');

const findAll = async () => {
  const [rows] = await pool.query('SELECT * FROM Cycle ORDER BY libelle ASC');
  return rows;
};

const findById = async (idCycle) => {
  const [rows] = await pool.query('SELECT * FROM Cycle WHERE idCycle = ?', [idCycle]);
  return rows[0] || null;
};

const create = async (data) => {
  const [result] = await pool.query(
    'INSERT INTO Cycle (libelle, description, idAdmin, created) VALUES (?, ?, ?, NOW())',
    [data.libelle, data.description || '', data.idAdmin]
  );
  return result.insertId;
};

const update = async (idCycle, data) => {
  const [result] = await pool.query(
    'UPDATE Cycle SET libelle = ?, description = ? WHERE idCycle = ?',
    [data.libelle, data.description, idCycle]
  );
  return result.affectedRows;
};

const remove = async (idCycle) => {
  const [result] = await pool.query('DELETE FROM Cycle WHERE idCycle = ?', [idCycle]);
  return result.affectedRows;
};

module.exports = { findAll, findById, create, update, remove };
