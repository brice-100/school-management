const pool = require('../config/db');

const findAll = async (filters = {}) => {
  let query = `
    SELECT c.*, cy.libelle as cycle_nom 
    FROM Classe c
    LEFT JOIN Cycle cy ON c.idCycle = cy.idCycle
    WHERE c.isDeleted = ?
    ORDER BY c.libelle ASC
  `;
  const params = [filters.isDeleted !== undefined ? filters.isDeleted : 0];
  const [rows] = await pool.query(query, params);
  return rows;
};

const findById = async (idClasse) => {
  const [rows] = await pool.query('SELECT * FROM Classe WHERE idClasse = ? AND isDeleted = 0', [idClasse]);
  return rows[0] || null;
};

const create = async (data) => {
  const [result] = await pool.query(
    'INSERT INTO Classe (libelle, idCycle, idAdmin, created_at) VALUES (?, ?, ?, NOW())',
    [data.libelle || 'INDEFINI', data.idCycle || 1, data.idAdmin]
  );
  return result.insertId;
};

const update = async (idClasse, data) => {
  const [result] = await pool.query(
    'UPDATE Classe SET libelle = ?, idCycle = ? WHERE idClasse = ?',
    [data.libelle, data.idCycle, idClasse]
  );
  return result.affectedRows;
};

const remove = async (idClasse) => {
  const [result] = await pool.query('UPDATE Classe SET isDeleted = 1 WHERE idClasse = ?', [idClasse]);
  return result.affectedRows;
};

const restore = async (idClasse) => {
  const [result] = await pool.query('UPDATE Classe SET isDeleted = 0 WHERE idClasse = ?', [idClasse]);
  return result.affectedRows;
};

module.exports = { findAll, findById, create, update, remove, restore };
