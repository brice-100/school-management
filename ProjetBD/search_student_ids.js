const mysql = require('mysql2/promise');
async function run() {
  try {
    const conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'root',
      database: 'school_db'
    });

    console.log('--- Colonnes student_id ---');
    const [cols] = await conn.query(`
      SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE COLUMN_NAME = 'student_id' 
      AND TABLE_SCHEMA = 'school_db'
    `);
    console.log(cols);

    await conn.end();
  } catch (e) {
    console.error(e);
  }
}
run();
