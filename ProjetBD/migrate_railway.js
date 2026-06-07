/**
 * migrate_railway.js
 * Lance uniquement les migrations sur la DB Railway (sans réimporter le schéma).
 * Usage: node migrate_railway.js --url "mysql://user:pass@host:port/dbname"
 */
require('dotenv').config();
const mysql = require('mysql2/promise');

const args   = process.argv.slice(2);
const urlArg = args.find(a => a.startsWith('--url='))?.split('=').slice(1).join('=')
            || args[args.indexOf('--url') + 1];
const dbUrl  = urlArg || process.env.RAILWAY_DB_URL;

if (!dbUrl) { console.error('❌ Fournir --url "mysql://..."'); process.exit(1); }

function parseDbUrl(url) {
  const u = new URL(url);
  return {
    host: u.hostname, port: parseInt(u.port) || 3306,
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: u.pathname.replace(/^\//, ''),
  };
}

const SKIP_CODES = new Set(['ER_DUP_FIELDNAME','ER_DUP_COLUMN_NAME','ER_TABLE_EXISTS_ERROR','ER_DUP_ENTRY','ER_DUP_KEYNAME']);

async function runSql(pool, sql, label) {
  try { await pool.query(sql); console.log(`✅ ${label}`); }
  catch (err) {
    if (SKIP_CODES.has(err.code)) { console.log(`ℹ️  ${label} (déjà appliqué)`); return; }
    throw err;
  }
}

async function addColIfMissing(pool, db, table, column, definition, label) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA=? AND TABLE_NAME=? AND COLUMN_NAME=?`,
    [db, table, column]
  );
  if (rows[0].cnt > 0) { console.log(`ℹ️  ${label} (déjà appliqué)`); return; }
  await pool.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
  console.log(`✅ ${label}`);
}

async function main() {
  const creds = parseDbUrl(dbUrl);
  console.log(`\n📡 Connexion Railway MySQL → ${creds.host}:${creds.port}/${creds.database}\n`);

  const pool = mysql.createPool({ ...creds, multipleStatements: true, ssl: { rejectUnauthorized: false } });
  const db   = creds.database;

  try {
    await addColIfMissing(pool, db, 'AnneeAcademique', 'est_active', 'TINYINT(1) UNSIGNED NOT NULL DEFAULT 0', 'AnneeAcademique.est_active');
    await addColIfMissing(pool, db, 'Personne',        'actif',      'TINYINT(1) UNSIGNED NOT NULL DEFAULT 1', 'Personne.actif');
    await addColIfMissing(pool, db, 'Paiement',        'valide',     'TINYINT(1) UNSIGNED NOT NULL DEFAULT 0', 'Paiement.valide');
    await addColIfMissing(pool, db, 'Paiement',        'idTranche',  'INT UNSIGNED NULL',                     'Paiement.idTranche');
    await addColIfMissing(pool, db, 'Paiement',        'type_paiement', "VARCHAR(30) NOT NULL DEFAULT 'cash'", 'Paiement.type_paiement');
    await addColIfMissing(pool, db, 'Paiement',        'phone_paiement','VARCHAR(20) NULL',                   'Paiement.phone_paiement');
    await addColIfMissing(pool, db, 'Session',         'date_passage',  'DATE NULL',                          'Session.date_passage');
    await addColIfMissing(pool, db, 'EmploiDuTemps',   'idAnnee',    'INT UNSIGNED NULL',                     'EmploiDuTemps.idAnnee');

    await runSql(pool, `INSERT IGNORE INTO Mode (idMode,libelle,information,actif,idFondateur,created_at) VALUES
      (1,'Cash','Paiement en espèces',1,1,NOW()),(2,'Mobile Money','MTN MoMo',1,1,NOW()),
      (3,'Orange Money','Orange Money',1,1,NOW()),(4,'Virement bancaire','Virement',1,1,NOW())`, 'Données Mode');

    await runSql(pool, `INSERT IGNORE INTO NatureEpreuve (idNature,libelle,description) VALUES
      (1,'Contrôle Continu','Évaluation continue'),(2,'Examen','Examen trimestriel'),
      (3,'Devoir Maison','Devoir à la maison'),(4,'Interrogation','Interrogation surprise')`, 'Données NatureEpreuve');

    await runSql(pool, `UPDATE AnneeAcademique SET est_active=1
      WHERE idAnnee=(SELECT MAX(idAnnee) FROM (SELECT idAnnee FROM AnneeAcademique) AS s)
        AND NOT EXISTS (SELECT 1 FROM (SELECT COUNT(*) as c FROM AnneeAcademique WHERE est_active=1) AS chk WHERE c>0)`,
      'Année académique active');

    await runSql(pool, `CREATE TABLE IF NOT EXISTS teacher_matieres (
      teacher_id INT UNSIGNED NOT NULL, matiere_id INT UNSIGNED NOT NULL,
      PRIMARY KEY (teacher_id,matiere_id),
      CONSTRAINT fk_tm_teacher FOREIGN KEY (teacher_id) REFERENCES Enseignant(idEnseignant) ON DELETE CASCADE,
      CONSTRAINT fk_tm_matiere FOREIGN KEY (matiere_id) REFERENCES Cours(idCours) ON DELETE CASCADE)`,
      'Table teacher_matieres');

    await runSql(pool, `INSERT IGNORE INTO teacher_matieres (teacher_id,matiere_id)
      SELECT idEnseignant,idCours FROM Enseignant WHERE idCours IS NOT NULL`, 'Peuplement teacher_matieres');

    // Migration matricule INT → VARCHAR(50)
    const [matCol] = await pool.query(
      `SELECT DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME='Eleve' AND COLUMN_NAME='matricule'`, [db]);
    if ((matCol[0]?.DATA_TYPE || '').toLowerCase() !== 'varchar') {
      console.log('🔄 Conversion matricule INT → VARCHAR(50)...');
      await pool.query('SET FOREIGN_KEY_CHECKS=0');
      for (const [t,fk] of [['Evaluation','matr'],['Frequente','freq'],['Paiement','enf'],['Parents','enft'],['Rapport','enfant']]) {
        try { await pool.query(`ALTER TABLE \`${t}\` DROP FOREIGN KEY \`${fk}\``); console.log(`ℹ️  FK ${fk} supprimée`); } catch {}
      }
      for (const t of ['Eleve','Evaluation','Frequente','Paiement','Parents','Rapport']) {
        await runSql(pool, `ALTER TABLE \`${t}\` MODIFY matricule VARCHAR(50) NOT NULL`, `matricule VARCHAR(50) → ${t}`);
      }
      for (const [t,fk] of [['Evaluation','matr'],['Frequente','freq'],['Paiement','enf'],['Parents','enft'],['Rapport','enfant']]) {
        try {
          await pool.query(`ALTER TABLE \`${t}\` ADD CONSTRAINT \`${fk}\` FOREIGN KEY (\`matricule\`) REFERENCES \`Eleve\`(\`matricule\`) ON DELETE NO ACTION ON UPDATE CASCADE`);
          console.log(`✅ FK ${fk} recrée sur ${t}`);
        } catch (e) { console.log(`ℹ️  FK ${fk} : ${e.message}`); }
      }
      await pool.query('SET FOREIGN_KEY_CHECKS=1');
    } else {
      console.log('ℹ️  matricule déjà en VARCHAR(50)');
    }

    console.log('\n🎉 Migrations Railway terminées avec succès !');
  } catch (err) {
    console.error('❌ Erreur :', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
