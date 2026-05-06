require('dotenv').config();
const mysql = require('mysql2/promise');

async function fixTeachers() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
  });

  try {
    // 1. Trouver les personnes de type 1 sans record dans Enseignant
    const [teachers] = await pool.query(`
      SELECT p.idPers, p.idAdmin 
      FROM Personne p
      LEFT JOIN Enseignant e ON p.idPers = e.idPers
      WHERE p.typePersonne = 1 AND e.idEnseignant IS NULL
    `);

    if (teachers.length === 0) {
      console.log('Aucun enseignant manquant dans la table Enseignant.');
      process.exit(0);
    }

    // 2. Trouver un cours par défaut pour ne pas laisser idCours à 0
    const [cours] = await pool.query('SELECT idCours FROM Cours LIMIT 1');
    const defaultCoursId = cours.length > 0 ? cours[0].idCours : 1;

    // 3. Insérer les records manquants
    for (const t of teachers) {
      await pool.query(
        'INSERT INTO Enseignant (idPers, idCours, Actif, idAdmin, created_at) VALUES (?, ?, 1, ?, NOW())',
        [t.idPers, defaultCoursId, t.idAdmin || 1]
      );
      console.log(`Record Enseignant créé pour idPers: ${t.idPers}`);
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
fixTeachers();
