const mysql = require('mysql2/promise');
async function run() {
  try {
    const conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'root',
      database: 'school_db'
    });
    const [rows] = await conn.query("SHOW TABLES LIKE '%Annee%'");
    console.log(rows);
    await conn.end();
  } catch (e) {
    console.error(e);
  }
}
run();
