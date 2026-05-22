const pool = require('../config/db');

const findAll = async (filters = {}) => {
  let query = `
    SELECT l.*, s.libelle AS libelleSpecialite 
    FROM Livres l 
    LEFT JOIN Specialite s ON l.idSpecialite = s.idSpecialite 
    WHERE 1=1
  `;
  const params = [];
  query += ' ORDER BY l.idLivre DESC';
  const [rows] = await pool.query(query, params);
  return rows;
};

const findById = async (idLivre) => {
  const [rows] = await pool.query('SELECT * FROM Livres WHERE idLivre = ?', [idLivre]);
  return rows[0] || null;
};

const create = async (data) => {
  const [result] = await pool.query(
    'INSERT INTO Livres (titre, auteurs, prix, idSpecialite, edition, annee_parution, totalCopie, idAdmin, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())',
    [data.titre, data.auteurs, data.prix || 0, data.idSpecialite || null, data.edition || '', data.annee_parution || '', data.totalCopie || 1, data.idAdmin]
  );
  return result.insertId;
};

const update = async (idLivre, data) => {
  const [result] = await pool.query(
    'UPDATE Livres SET titre = ?, auteurs = ?, prix = ?, edition = ?, annee_parution = ?, totalCopie = ? WHERE idLivre = ?',
    [data.titre, data.auteurs, data.prix, data.edition, data.annee_parution, data.totalCopie, idLivre]
  );
  return result.affectedRows;
};

const remove = async (idLivre) => {
  const [result] = await pool.query('DELETE FROM Livres WHERE idLivre = ?', [idLivre]);
  return result.affectedRows;
};

module.exports = { findAll, findById, create, update, remove };
