const mysql = require('mysql2/promise');
async function check() {
  try {
    const conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'root',
      database: 'school_db'
    });
    const [cols] = await conn.query('SHOW COLUMNS FROM Eleve');
    console.log('Eleve columns:', cols.map(c => c.Field));
    const [ensCols] = await conn.query('SHOW COLUMNS FROM Enseignant');
    console.log('Enseignant columns:', ensCols.map(c => c.Field));
    const [freqCols] = await conn.query('SHOW COLUMNS FROM Frequente');
    console.log('Frequente columns:', freqCols.map(c => c.Field));
    await conn.end();
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
check();
