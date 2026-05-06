require('dotenv').config({ path: './src/.env' }); // Wait, it's ./projetBD/.env or just .env
const mysql = require('mysql2/promise');

async function check() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'school_db'
  });

  try {
    const [f] = await pool.query('SHOW COLUMNS FROM FicheEnseignant');
    console.log('FicheEnseignant:', f.map(c => c.Field).join(', '));
  } catch (e) { console.log('FicheEnseignant Error:', e.message); }

  try {
    const [m] = await pool.query('SHOW COLUMNS FROM Message');
    console.log('Message:', m.map(c => c.Field).join(', '));
  } catch (e) { console.log('Message Error:', e.message); }

  try {
    const [n] = await pool.query('SHOW COLUMNS FROM Notification');
    console.log('Notification:', n.map(c => c.Field).join(', '));
  } catch (e) { console.log('Notification Error:', e.message); }

  try {
    const [s] = await pool.query('SHOW COLUMNS FROM Salaire');
    console.log('Salaire:', s.map(c => c.Field).join(', '));
  } catch (e) { console.log('Salaire Error:', e.message); }

  process.exit(0);
}
check();
