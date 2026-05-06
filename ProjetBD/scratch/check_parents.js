const mysql = require('mysql2/promise');
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'school_db'
});

async function run() {
  try {
    const [rows] = await pool.query(`
      SELECT 
        p.idPers, p.nom, p.prenom, p.mobile, p.phone, p.username, p.actif,
        pa.idParent
      FROM Personne p
      LEFT JOIN Parents pa ON p.idPers = pa.idPers
      WHERE p.typePersonne = 4
    `);
    console.log(JSON.stringify(rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}
run();
