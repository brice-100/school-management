const pool = require('../config/db');

const findAll = async () => {
  const [rows] = await pool.query('SELECT * FROM AnneeAcademique ORDER BY idAnnee DESC');
  return rows;
};

const findById = async (idAnnee) => {
  const [rows] = await pool.query('SELECT * FROM AnneeAcademique WHERE idAnnee = ?', [idAnnee]);
  return rows[0] || null;
};

const getActive = async () => {
  const [rows] = await pool.query('SELECT * FROM AnneeAcademique WHERE statut = 1 LIMIT 1');
  // Fallback if no active year is set yet
  if (rows.length === 0) {
    const [fallback] = await pool.query('SELECT * FROM AnneeAcademique ORDER BY idAnnee DESC LIMIT 1');
    return fallback[0] || null;
  }
  return rows[0];
};

const setActive = async (idAnnee) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('UPDATE AnneeAcademique SET statut = 0');
    const [result] = await conn.query('UPDATE AnneeAcademique SET statut = 1 WHERE idAnnee = ?', [idAnnee]);
    await conn.commit();
    return result.affectedRows;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

const create = async (data) => {
  const [result] = await pool.query(
    'INSERT INTO AnneeAcademique (libelle, periode, created_at, idAdmin) VALUES (?, ?, NOW(), ?)',
    [data.libelle, data.periode, data.idAdmin]
  );
  return result.insertId;
};

const update = async (idAnnee, data) => {
  const [result] = await pool.query(
    'UPDATE AnneeAcademique SET libelle = ?, periode = ? WHERE idAnnee = ?',
    [data.libelle, data.periode, idAnnee]
  );
  return result.affectedRows;
};

const remove = async (idAnnee) => {
  const [result] = await pool.query('DELETE FROM AnneeAcademique WHERE idAnnee = ?', [idAnnee]);
  return result.affectedRows;
};

module.exports = { findAll, findById, getActive, setActive, create, update, remove };
