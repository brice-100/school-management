const pool = require('../config/db');

const findAll = async (filters = {}) => {
  let query = `
    SELECT c.*, cy.libelle as cycle_nom,
      COALESCE(c.pension, s.pension) as pension_effective,
      COALESCE(c.inscription, s.inscription) as inscription_effective
    FROM Classe c
    LEFT JOIN Cycle cy ON c.idCycle = cy.idCycle
    LEFT JOIN Scolarite s ON s.idCycle = c.idCycle
    WHERE c.isDeleted = ?
    ORDER BY c.libelle ASC
  `;
  const params = [filters.isDeleted !== undefined ? filters.isDeleted : 0];
  const [rows] = await pool.query(query, params);
  return rows;
};

const findById = async (idClasse) => {
  const [rows] = await pool.query(`
    SELECT c.*, cy.libelle as cycle_nom,
      COALESCE(c.pension, s.pension) as pension_effective,
      COALESCE(c.inscription, s.inscription) as inscription_effective
    FROM Classe c
    LEFT JOIN Cycle cy ON c.idCycle = cy.idCycle
    LEFT JOIN Scolarite s ON s.idCycle = c.idCycle
    WHERE c.idClasse = ? AND c.isDeleted = 0
  `, [idClasse]);
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
    'UPDATE Classe SET libelle = ?, idCycle = ?, pension = ?, inscription = ? WHERE idClasse = ?',
    [
      data.libelle,
      data.idCycle,
      data.pension !== undefined && data.pension !== '' ? parseFloat(data.pension) : null,
      data.inscription !== undefined && data.inscription !== '' ? parseFloat(data.inscription) : null,
      idClasse
    ]
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
