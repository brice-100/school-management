const pool = require('../config/db');

const findAll = async () => {
  const [rows] = await pool.query(`
    SELECT s.*, c.libelle as cycle_nom 
    FROM Scolarite s
    LEFT JOIN Cycle c ON s.idCycle = c.idCycle
    ORDER BY s.idScolarite DESC
  `);
  return rows;
};

const findById = async (idScolarite) => {
  const [rows] = await pool.query('SELECT * FROM Scolarite WHERE idScolarite = ?', [idScolarite]);
  return rows[0] || null;
};

const create = async (data) => {
  const [result] = await pool.query(
    'INSERT INTO Scolarite (inscription, pension, nbreTranche, description, idCycle, idFondateur, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
    [data.inscription || 0, data.pension || 0, data.nbreTranche || 1, data.description || '', data.idCycle, data.idFondateur]
  );
  return result.insertId;
};

const update = async (idScolarite, data) => {
  const [result] = await pool.query(
    'UPDATE Scolarite SET inscription = ?, pension = ?, nbreTranche = ?, description = ?, idCycle = ? WHERE idScolarite = ?',
    [data.inscription, data.pension, data.nbreTranche, data.description, data.idCycle, idScolarite]
  );
  return result.affectedRows;
};

const remove = async (idScolarite) => {
  const [result] = await pool.query('DELETE FROM Scolarite WHERE idScolarite = ?', [idScolarite]);
  return result.affectedRows;
};

module.exports = { findAll, findById, create, update, remove };
