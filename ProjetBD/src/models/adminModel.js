const pool = require('../config/db');

/**
 * Trouve un Admin par son username.
 * @param {string} username
 * @returns {object|null}
 */
const findByUsername = async (username) => {
  const [rows] = await pool.query(
    'SELECT * FROM Admin WHERE username = ? AND actif = 1 LIMIT 1',
    [username]
  );
  return rows[0] || null;
};

/**
 * Trouve un Admin par son ID.
 * @param {number} id
 * @returns {object|null}
 */
const findById = async (id) => {
  const [rows] = await pool.query(
    'SELECT ID, nom, username, typeAdmin, mobile, alanyaID, created_at FROM Admin WHERE ID = ? LIMIT 1',
    [id]
  );
  return rows[0] || null;
};

module.exports = { findByUsername, findById };
