require('dotenv').config();
const mysql = require('mysql2/promise');

async function fixAutoIncrement() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  const tablesToFix = [
    { table: 'Admin', pk: 'ID' },
    { table: 'AnneeAcademique', pk: 'idAnnee' },
    { table: 'Classe', pk: 'idClasse' },
    { table: 'Cours', pk: 'idCours' },
    { table: 'Cycle', pk: 'idCycle' },
    { table: 'Eleve', pk: 'matricule' },
    { table: 'EmploiDuTemps', pk: 'idTemps' },
    { table: 'Enseignant', pk: 'idEnseignant' },
    { table: 'Epreuve', pk: 'idEpreuve' },
    { table: 'Evaluation', pk: 'idEval' },
    { table: 'Frequente', pk: 'idFrequente' },
    { table: 'Justificatifs', pk: 'ID' },
    { table: 'Livres', pk: 'idLivre' },
    { table: 'Messages', pk: 'idMessages' },
    { table: 'Mode', pk: 'idMode' },
    { table: 'NatureEpreuve', pk: 'idNature' },
    { table: 'Paiement', pk: 'idPaie' },
    { table: 'Parents', pk: 'idParent' },
    { table: 'Personne', pk: 'idPers' },
    { table: 'Quartier', pk: 'idQuartier' },
    { table: 'Rapport', pk: 'idRap' },
    { table: 'Residents', pk: 'idResi' },
    { table: 'Salle', pk: 'idSalle' },
    { table: 'Scolarite', pk: 'idScolarite' },
    { table: 'Session', pk: 'idSession' },
    { table: 'Specialite', pk: 'idSpecialite' },
    { table: 'Titulaire', pk: 'idTitulaire' },
    { table: 'Tranches', pk: 'idTranche' },
    { table: 'Trimestre', pk: 'idTrimes' },
    { table: 'VilleNaissance', pk: 'idVille' }
  ];

  try {
    await pool.query('SET FOREIGN_KEY_CHECKS=0');
    for (const { table, pk } of tablesToFix) {
      try {
        await pool.query(`ALTER TABLE ${table} MODIFY ${pk} int UNSIGNED NOT NULL AUTO_INCREMENT`);
        console.log(`✅ Fixed ${table}.${pk}`);
      } catch(err) {
        console.error(`❌ Failed ${table}.${pk}:`, err.message);
      }
    }
    await pool.query('SET FOREIGN_KEY_CHECKS=1');
  } catch (err) {
    console.error("Global Error:", err);
  }
  process.exit();
}

fixAutoIncrement();
