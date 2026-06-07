require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const SKIP_CODES = new Set([
  'ER_DUP_FIELDNAME',
  'ER_DUP_COLUMN_NAME',
  'ER_TABLE_EXISTS_ERROR',
  'ER_DUP_ENTRY',
  'ER_DUP_KEYNAME',
]);

async function runSql(pool, sql, label) {
  try {
    await pool.query(sql);
    console.log(`✅ ${label}`);
  } catch (err) {
    if (SKIP_CODES.has(err.code)) {
      console.log(`ℹ️  ${label} (déjà appliqué)`);
      return;
    }
    throw err;
  }
}

async function addColumnIfMissing(pool, table, column, definition, label) {
  const dbName = process.env.DB_NAME;
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [dbName, table, column]
  );
  if (rows[0].cnt > 0) {
    console.log(`ℹ️  ${label} (déjà appliqué)`);
    return;
  }
  await pool.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
  console.log(`✅ ${label}`);
}

async function runMigrations() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true,
  });

  console.log(`🔄 Migrations sur la base « ${process.env.DB_NAME} »...`);

  try {
    await addColumnIfMissing(pool, 'AnneeAcademique', 'est_active',
      'TINYINT(1) UNSIGNED NOT NULL DEFAULT 0', 'Colonne AnneeAcademique.est_active');

    await addColumnIfMissing(pool, 'Personne', 'actif',
      'TINYINT(1) UNSIGNED NOT NULL DEFAULT 0', 'Colonne Personne.actif');

    await addColumnIfMissing(pool, 'Paiement', 'valide',
      'TINYINT(1) UNSIGNED NOT NULL DEFAULT 0', 'Colonne Paiement.valide');

    await addColumnIfMissing(pool, 'Paiement', 'idTranche',
      'INT UNSIGNED NULL', 'Colonne Paiement.idTranche');

    await addColumnIfMissing(pool, 'Paiement', 'type_paiement',
      "VARCHAR(30) NOT NULL DEFAULT 'cash'", 'Colonne Paiement.type_paiement');

    await addColumnIfMissing(pool, 'Paiement', 'phone_paiement',
      'VARCHAR(20) NULL', 'Colonne Paiement.phone_paiement');

    await addColumnIfMissing(pool, 'Session', 'date_passage',
      'DATE NULL', 'Colonne Session.date_passage');

    await addColumnIfMissing(pool, 'EmploiDuTemps', 'idAnnee',
      'INT UNSIGNED NULL', 'Colonne EmploiDuTemps.idAnnee');

    await runSql(pool, `
      INSERT IGNORE INTO Mode (idMode, libelle, information, actif, idFondateur, created_at)
      VALUES
        (1, 'Cash', 'Paiement en espèces directement à l''école', 1, 1, NOW()),
        (2, 'Mobile Money', 'Paiement via MTN Mobile Money', 1, 1, NOW()),
        (3, 'Orange Money', 'Paiement via Orange Money', 1, 1, NOW()),
        (4, 'Virement bancaire', 'Virement bancaire classique', 1, 1, NOW())
    `, 'Données initiales Mode');

    await runSql(pool, `
      INSERT IGNORE INTO NatureEpreuve (idNature, libelle, description)
      VALUES
        (1, 'Contrôle Continu', 'Évaluation continue en classe'),
        (2, 'Examen', 'Examen trimestriel ou semestriel'),
        (3, 'Devoir Maison', 'Devoir à réaliser à la maison'),
        (4, 'Interrogation', 'Interrogation surprise')
    `, 'Données initiales NatureEpreuve');

    await runSql(pool, `
      UPDATE AnneeAcademique SET est_active = 1
      WHERE idAnnee = (SELECT MAX(idAnnee) FROM (SELECT idAnnee FROM AnneeAcademique) AS sub)
        AND NOT EXISTS (SELECT 1 FROM (SELECT COUNT(*) as cnt FROM AnneeAcademique WHERE est_active = 1) AS chk WHERE cnt > 0)
    `, 'Année académique active');

    await runSql(pool, `
      CREATE TABLE IF NOT EXISTS teacher_matieres (
        teacher_id INT UNSIGNED NOT NULL,
        matiere_id INT UNSIGNED NOT NULL,
        PRIMARY KEY (teacher_id, matiere_id),
        CONSTRAINT fk_tm_teacher FOREIGN KEY (teacher_id) REFERENCES Enseignant(idEnseignant) ON DELETE CASCADE,
        CONSTRAINT fk_tm_matiere FOREIGN KEY (matiere_id) REFERENCES Cours(idCours) ON DELETE CASCADE
      )
    `, 'Table teacher_matieres');

    await runSql(pool, `
      INSERT IGNORE INTO teacher_matieres (teacher_id, matiere_id)
      SELECT idEnseignant, idCours FROM Enseignant WHERE idCours IS NOT NULL
    `, 'Peuplement teacher_matieres');

    await pool.query('SET FOREIGN_KEY_CHECKS = 0');
    for (const table of ['Eleve', 'Evaluation', 'Frequente', 'Paiement', 'Parents', 'Rapport']) {
      await runSql(pool,
        `ALTER TABLE ${table} MODIFY matricule VARCHAR(50) NOT NULL`,
        `Matricule VARCHAR(50) sur ${table}`);
    }
    await pool.query('SET FOREIGN_KEY_CHECKS = 1');

    const dbName = process.env.DB_NAME;
    const [cols] = await pool.query(`
      SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ?
        AND TABLE_NAME IN ('Paiement', 'Session', 'AnneeAcademique', 'Personne')
        AND COLUMN_NAME IN ('valide','idTranche','type_paiement','phone_paiement','date_passage','est_active','actif')
      ORDER BY TABLE_NAME, COLUMN_NAME
    `, [dbName]);

    console.log('\n📋 Colonnes migrées :');
    cols.forEach(c => console.log(`   - ${c.TABLE_NAME}.${c.COLUMN_NAME} (${c.DATA_TYPE})`));
    console.log('\n🎉 Migrations terminées avec succès !');
  } catch (err) {
    console.error('❌ Erreur migration :', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

runMigrations();
