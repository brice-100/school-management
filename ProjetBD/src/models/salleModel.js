const pool = require('../config/db');

const findAll = async () => {
  const [rows] = await pool.query('SELECT * FROM Salle ORDER BY libelle ASC');
  return rows;
};

const findById = async (idSalle) => {
  const [rows] = await pool.query('SELECT * FROM Salle WHERE idSalle = ?', [idSalle]);
  return rows[0] || null;
};

const create = async (data) => {
  const [result] = await pool.query(
    'INSERT INTO Salle (libelle, position, surface, idClasse, idAdmin, actif, created_at) VALUES (?, ?, ?, ?, ?, 1, NOW())',
    [data.libelle, data.position || 'NON DEFINI', data.surface || '', data.idClasse, data.idAdmin]
  );
  return result.insertId;
};

const update = async (idSalle, data) => {
  const fields = [];
  const params = [];
  
  if (data.libelle !== undefined) { fields.push('libelle = ?'); params.push(data.libelle); }
  if (data.position !== undefined) { fields.push('position = ?'); params.push(data.position); }
  if (data.surface !== undefined) { fields.push('surface = ?'); params.push(data.surface); }
  if (data.idClasse !== undefined) { fields.push('idClasse = ?'); params.push(data.idClasse); }
  if (data.actif !== undefined) { fields.push('actif = ?'); params.push(data.actif); }

  if (fields.length === 0) return 0;
  
  params.push(idSalle);
  const [result] = await pool.query(`UPDATE Salle SET ${fields.join(', ')} WHERE idSalle = ?`, params);
  return result.affectedRows;
};

const remove = async (idSalle) => {
  const [result] = await pool.query('DELETE FROM Salle WHERE idSalle = ?', [idSalle]);
  return result.affectedRows;
};

module.exports = { findAll, findById, create, update, remove };
