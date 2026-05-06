const pool = require('../config/db');

/**
 * Trouve une Personne par son username.
 * @param {string} username
 * @returns {object|null}
 */
const findByUsername = async (username) => {
  const [rows] = await pool.query(
    'SELECT * FROM Personne WHERE username = ? LIMIT 1',
    [username]
  );
  return rows[0] || null;
};

/**
 * Trouve une Personne par son ID (sans le password).
 * @param {number} id
 * @returns {object|null}
 */
const findById = async (id) => {
  const [rows] = await pool.query(
    `SELECT idPers, nom, prenom, dateNaissance, lieuNaissance,
            mobile, phone, typePersonne, username, alanyaID, created_at
     FROM Personne WHERE idPers = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
};

/**
 * Crée une Personne en attente de validation (actif = 0).
 * Utilisé pour l'inscription publique (enseignants et parents).
 * @param {object} data
 * @returns {number} insertId
 */
const createPendingPersonne = async (data) => {
  const { nom, prenom, mobile, phone, typePersonne, username, password } = data;
  
  const [result] = await pool.query(
    `INSERT INTO Personne
       (nom, prenom, dateNaissance, lieuNaissance, mobile, phone,
        typePersonne, username, password, alanyaID, idAdmin, actif, created_at)
     VALUES (?, ?, '1970-01-01', 'INDEFINI', ?, ?, ?, ?, ?, NULL, 1, 0, NOW())`,
    [
      nom, prenom, mobile || '000', phone || '000', 
      typePersonne, username, password
    ]
  );
  return result.insertId;
};

module.exports = { findByUsername, findById, createPendingPersonne };
