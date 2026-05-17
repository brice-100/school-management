const pool = require('../config/db');

const findAll = async (filters = {}) => {
  let query = `
    SELECT m.*, p.nom, p.prenom 
    FROM Messages m 
    LEFT JOIN Personne p ON m.idParent = p.idPers
    WHERE m.isDeleted = ?
  `;
  const params = [filters.isDeleted !== undefined ? filters.isDeleted : 0];
  query += ' ORDER BY m.created_at DESC';
  const [rows] = await pool.query(query, params);
  return rows;
};

const findById = async (idMessages) => {
  const [rows] = await pool.query('SELECT * FROM Messages WHERE idMessages = ? AND isDeleted = 0', [idMessages]);
  return rows[0] || null;
};

const create = async (data) => {
  const [result] = await pool.query(
    'INSERT INTO Messages (idExp_Pers, idParent, objet, information, type_message, AnneeAcade, created_at, valider) VALUES (?, ?, ?, ?, ?, ?, NOW(), ?)',
    [data.idExp_Pers, data.idParent || null, data.objet, data.information, data.type_message !== undefined ? parseInt(data.type_message) : 0, data.AnneeAcade || '2023-2024', data.valider || 0]
  );
  return result.insertId;
};

const update = async (idMessages, data) => {
  const fields = [];
  const params = [];

  if (data.objet !== undefined) {
    fields.push('objet = ?');
    params.push(data.objet);
  }
  if (data.information !== undefined) {
    fields.push('information = ?');
    params.push(data.information);
  }
  if (data.valider !== undefined) {
    fields.push('valider = ?');
    params.push(parseInt(data.valider) || 0);
  }

  if (fields.length === 0) return 0;

  params.push(idMessages);
  const [result] = await pool.query(
    `UPDATE Messages SET ${fields.join(', ')} WHERE idMessages = ?`,
    params
  );
  return result.affectedRows;
};

const remove = async (idMessages) => {
  const [result] = await pool.query('UPDATE Messages SET isDeleted = 1 WHERE idMessages = ?', [idMessages]);
  return result.affectedRows;
};

const restore = async (idMessages) => {
  const [result] = await pool.query('UPDATE Messages SET isDeleted = 0 WHERE idMessages = ?', [idMessages]);
  return result.affectedRows;
};

module.exports = { findAll, findById, create, update, remove, restore };
