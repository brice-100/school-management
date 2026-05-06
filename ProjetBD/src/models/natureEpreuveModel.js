const pool = require('../config/db');

const findAll = async () => {
  const [rows] = await pool.query('SELECT * FROM NatureEpreuve ORDER BY idNature ASC');
  return rows;
};

module.exports = { findAll };
