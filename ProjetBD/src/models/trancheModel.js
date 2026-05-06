const pool = require('../config/db');

const findAll = async (filters = {}) => {
  let query = 'SELECT * FROM Tranches WHERE 1=1';
  const params = [];
  if (filters.idScolarite) {
    query += ' AND idScolarite = ?';
    params.push(filters.idScolarite);
  }
  query += ' ORDER BY idTranche ASC';
  const [rows] = await pool.query(query, params);
  return rows;
};

const findById = async (idTranche) => {
  const [rows] = await pool.query('SELECT * FROM Tranches WHERE idTranche = ?', [idTranche]);
  return rows[0] || null;
};

const create = async (data) => {
  const [result] = await pool.query(
    'INSERT INTO Tranches (libelle, montant, delai_mois, delai_jour, idScolarite, actif, idFondateur) VALUES (?, ?, ?, ?, ?, 1, ?)',
    [data.libelle, data.montant || 0, data.delai_mois || '01', data.delai_jour || '01', data.idScolarite, data.idFondateur]
  );
  return result.insertId;
};

const update = async (idTranche, data) => {
  const [result] = await pool.query(
    'UPDATE Tranches SET libelle = ?, montant = ?, delai_mois = ?, delai_jour = ?, idScolarite = ? WHERE idTranche = ?',
    [data.libelle, data.montant, data.delai_mois, data.delai_jour, data.idScolarite, idTranche]
  );
  return result.affectedRows;
};

const remove = async (idTranche) => {
  const [result] = await pool.query('DELETE FROM Tranches WHERE idTranche = ?', [idTranche]);
  return result.affectedRows;
};

module.exports = { findAll, findById, create, update, remove };
