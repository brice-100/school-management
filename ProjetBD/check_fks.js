const mysql = require('mysql2/promise');
async function run() {
  try {
    const conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'root',
      database: 'school_db'
    });

    console.log('--- Structure de la table Eleve ---');
    const [cols] = await conn.query('DESCRIBE Eleve');
    console.log(cols);

    console.log('\n--- Clés étrangères pointant vers Eleve.matricule ---');
    const [fks] = await conn.query(`
      SELECT TABLE_NAME, COLUMN_NAME, CONSTRAINT_NAME 
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
      WHERE REFERENCED_TABLE_NAME = 'Eleve' 
      AND REFERENCED_COLUMN_NAME = 'matricule'
    `);
    console.log(fks);

    await conn.end();
  } catch (e) {
    console.error(e);
  }
}
run();
