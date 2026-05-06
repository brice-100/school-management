const pool = require('../config/db');

const findAll = async (filters = {}) => {
  let query = `
    SELECT m.*, p.nom, p.prenom 
    FROM Messages m 
    LEFT JOIN Personne p ON m.idParent = p.idPers
    WHERE 1=1
  `;
  const params = [];
  query += ' ORDER BY m.created_at DESC';
  const [rows] = await pool.query(query, params);
  return rows;
};

const findById = async (idMessages) => {
  const [rows] = await pool.query('SELECT * FROM Messages WHERE idMessages = ?', [idMessages]);
  return rows[0] || null;
};

const create = async (data) => {
  const [result] = await pool.query(
    'INSERT INTO Messages (idExp_Pers, idParent, objet, information, type_message, AnneeAcade, created_at, valider) VALUES (?, ?, ?, ?, ?, ?, NOW(), ?)',
    [data.idExp_Pers, data.idParent || null, data.objet, data.information, data.type_message || 'info', data.AnneeAcade || null, data.valider || 0]
  );
  return result.insertId;
};

const update = async (idMessages, data) => {
  const [result] = await pool.query(
    'UPDATE Messages SET objet = ?, information = ? WHERE idMessages = ?',
    [data.objet, data.information, idMessages]
  );
  return result.affectedRows;
};

const remove = async (idMessages) => {
  const [result] = await pool.query('DELETE FROM Messages WHERE idMessages = ?', [idMessages]);
  return result.affectedRows;
};

module.exports = { findAll, findById, create, update, remove };
