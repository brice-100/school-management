require('dotenv').config({ override: false });
const mysql = require('mysql2/promise');

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

async function fixAutoIncrements(pool) {
  const tables = [
    ['personne',    'idPers'],
    ['eleve',       'idEleve'],
    ['enseignant',  'idEnseignant'],
    ['parents',     'idParent'],
    ['classe',      'idClasse'],
    ['paiement',    'idPaiement'],
    ['cours',       'idCours'],
    ['evaluation',  'idEvaluation'],
  ];

  await pool.query('SET FOREIGN_KEY_CHECKS = 0');
  for (const [table, col] of tables) {
    try {
      // Récupère le type actuel de la colonne
      const [rows] = await pool.query(
        `SELECT COLUMN_TYPE, EXTRA FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
        [process.env.DB_NAME, table, col]
      );
      if (!rows.length) {
        console.log(`ℹ️  Table ${table} introuvable, ignorée`);
        continue;
      }
      if (rows[0].EXTRA.includes('auto_increment')) {
        console.log(`ℹ️  ${table}.${col} AUTO_INCREMENT déjà présent`);
        continue;
      }
      const colType = rows[0].COLUMN_TYPE;
      await pool.query(
        `ALTER TABLE \`${table}\` MODIFY \`${col}\` ${colType} NOT NULL AUTO_INCREMENT`
      );
      console.log(`✅ AUTO_INCREMENT ajouté sur ${table}.${col}`);
    } catch (err) {
      console.log(`ℹ️  ${table}.${col} → ${err.message}`);
    }
  }
  await pool.query('SET FOREIGN_KEY_CHECKS = 1');
  console.log('✅ AUTO_INCREMENT vérifié sur toutes les tables');
}

async function seedAdmin(pool) {
  const bcrypt = require('bcryptjs');
  const [rows] = await pool.query('SELECT ID FROM admin WHERE typeAdmin = 0 LIMIT 1');
  if (rows.length === 0) {
    const hash = await bcrypt.hash(process.env.ADMIN_DEFAULT_PASSWORD, 10);
    await pool.query(
      `INSERT INTO admin (ID, nom, username, password, typeAdmin, mobile, alanyaID, created_at)
       VALUES (1, 'Root', ?, ?, 0, '0000', '0', NOW())`,
      [process.env.ADMIN_DEFAULT_USERNAME, hash]
    );
    console.log('✅ Super admin créé');
  } else {
    console.log('ℹ️ Super admin déjà présent');
  }
}

async function runMigrations() {
  const dbUrl = process.env.MYSQL_URL || process.env.DATABASE_URL || process.env.MYSQL_PUBLIC_URL;
  let dbConfig;

  if (dbUrl) {
    const url = new URL(dbUrl);
    dbConfig = {
      host:     url.hostname,
      port:     parseInt(url.port) || 3306,
      user:     decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: url.pathname.replace(/^\//, ''),
    };
  } else {
    dbConfig = {
      host:     process.env.DB_HOST || '127.0.0.1',
      port:     parseInt(process.env.DB_PORT) || 3306,
      user:     process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    };
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const pool = mysql.createPool({
    ...dbConfig,
    multipleStatements: true,
    ...(isProduction && { ssl: { rejectUnauthorized: false } }),
  });

  // Override DB_NAME pour les requêtes INFORMATION_SCHEMA
  process.env.DB_NAME = dbConfig.database;

  console.log(`🔄 Migrations sur la base « ${dbConfig.database} » (${dbConfig.host}:${dbConfig.port})...`);

  try {
    // ─── 1. AUTO_INCREMENT sur toutes les tables ──────────────────
    await fixAutoIncrements(pool);

    // ─── 2. Seed Super Admin ──────────────────────────────────────
    await seedAdmin(pool);

    // ─── 3. Colonnes manquantes ───────────────────────────────────
    await addColumnIfMissing(pool, 'anneeacademique', 'est_active',
      'TINYINT(1) UNSIGNED NOT NULL DEFAULT 0', 'Colonne AnneeAcademique.est_active');
    await addColumnIfMissing(pool, 'personne', 'actif',
      'TINYINT(1) UNSIGNED NOT NULL DEFAULT 0', 'Colonne Personne.actif');
    await addColumnIfMissing(pool, 'paiement', 'valide',
      'TINYINT(1) UNSIGNED NOT NULL DEFAULT 0', 'Colonne Paiement.valide');
    await addColumnIfMissing(pool, 'paiement', 'idTranche',
      'INT UNSIGNED NULL', 'Colonne Paiement.idTranche');
    await addColumnIfMissing(pool, 'paiement', 'type_paiement',
      "VARCHAR(30) NOT NULL DEFAULT 'cash'", 'Colonne Paiement.type_paiement');
    await addColumnIfMissing(pool, 'paiement', 'phone_paiement',
      'VARCHAR(20) NULL', 'Colonne Paiement.phone_paiement');
    await addColumnIfMissing(pool, 'session', 'date_passage',
      'DATE NULL', 'Colonne Session.date_passage');
    await addColumnIfMissing(pool, 'emploi_du_temps', 'idAnnee',
      'INT UNSIGNED NULL', 'Colonne EmploiDuTemps.idAnnee');

    // ─── 4. Données initiales ─────────────────────────────────────
    await runSql(pool, `
      INSERT IGNORE INTO mode (idMode, libelle, information, actif, idFondateur, created_at)
      VALUES
        (1, 'Cash',              'Paiement en espèces directement à l''école', 1, 1, NOW()),
        (2, 'Mobile Money',      'Paiement via MTN Mobile Money',               1, 1, NOW()),
        (3, 'Orange Money',      'Paiement via Orange Money',                   1, 1, NOW()),
        (4, 'Virement bancaire', 'Virement bancaire classique',                 1, 1, NOW())
    `, 'Données initiales Mode');

    await runSql(pool, `
      INSERT IGNORE INTO natureepreuve (idNature, libelle, description)
      VALUES
        (1, 'Contrôle Continu', 'Évaluation continue en classe'),
        (2, 'Examen',           'Examen trimestriel ou semestriel'),
        (3, 'Devoir Maison',    'Devoir à réaliser à la maison'),
        (4, 'Interrogation',    'Interrogation surprise')
    `, 'Données initiales NatureEpreuve');

    await runSql(pool, `
      UPDATE anneeacademique SET est_active = 1
      WHERE idAnnee = (SELECT MAX(idAnnee) FROM (SELECT idAnnee FROM anneeacademique) AS sub)
        AND NOT EXISTS (
          SELECT 1 FROM (SELECT COUNT(*) as cnt FROM anneeacademique WHERE est_active = 1) AS chk
          WHERE cnt > 0
        )
    `, 'Année académique active');

    await runSql(pool, `
      CREATE TABLE IF NOT EXISTS teacher_matieres (
        teacher_id INT UNSIGNED NOT NULL,
        matiere_id INT UNSIGNED NOT NULL,
        PRIMARY KEY (teacher_id, matiere_id),
        CONSTRAINT fk_tm_teacher FOREIGN KEY (teacher_id) REFERENCES enseignant(idEnseignant) ON DELETE CASCADE,
        CONSTRAINT fk_tm_matiere FOREIGN KEY (matiere_id) REFERENCES cours(idCours) ON DELETE CASCADE
      )
    `, 'Table teacher_matieres');

    await runSql(pool, `
      INSERT IGNORE INTO teacher_matieres (teacher_id, matiere_id)
      SELECT idEnseignant, idCours FROM enseignant WHERE idCours IS NOT NULL
    `, 'Peuplement teacher_matieres');

    // ─── 5. Migration matricule INT → VARCHAR(50) ─────────────────
    const [eleveMatCol] = await pool.query(
      `SELECT DATA_TYPE FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'eleve' AND COLUMN_NAME = 'matricule'`,
      [process.env.DB_NAME]
    );
    const currentType = eleveMatCol[0]?.DATA_TYPE?.toLowerCase() || '';

    if (currentType !== 'varchar') {
      console.log('🔄 Conversion matricule INT → VARCHAR(50)...');
      await pool.query('SET FOREIGN_KEY_CHECKS = 0');
      const fksToDrop = [
        { table: 'evaluation', fk: 'matr'   },
        { table: 'frequente',  fk: 'freq'   },
        { table: 'paiement',   fk: 'enf'    },
        { table: 'parents',    fk: 'enft'   },
        { table: 'rapport',    fk: 'enfant' },
      ];
      for (const { table, fk } of fksToDrop) {
        try {
          await pool.query(`ALTER TABLE \`${table}\` DROP FOREIGN KEY \`${fk}\``);
        } catch { /* FK peut ne pas exister */ }
      }
      for (const table of ['eleve', 'evaluation', 'frequente', 'paiement', 'parents', 'rapport']) {
        await runSql(pool,
          `ALTER TABLE \`${table}\` MODIFY matricule VARCHAR(50) NOT NULL`,
          `Matricule VARCHAR(50) sur ${table}`);
      }
      const fksToCreate = [
        { table: 'evaluation', fk: 'matr',   ref: 'eleve', col: 'matricule' },
        { table: 'frequente',  fk: 'freq',   ref: 'eleve', col: 'matricule' },
        { table: 'paiement',   fk: 'enf',    ref: 'eleve', col: 'matricule' },
        { table: 'parents',    fk: 'enft',   ref: 'eleve', col: 'matricule' },
        { table: 'rapport',    fk: 'enfant', ref: 'eleve', col: 'matricule' },
      ];
      for (const { table, fk, ref, col } of fksToCreate) {
        try {
          await pool.query(
            `ALTER TABLE \`${table}\` ADD CONSTRAINT \`${fk}\`
             FOREIGN KEY (\`matricule\`) REFERENCES \`${ref}\`(\`${col}\`)
             ON DELETE NO ACTION ON UPDATE CASCADE`
          );
          console.log(`✅ FK ${fk} recrée sur ${table}`);
        } catch (e) {
          console.log(`ℹ️  FK ${fk} non recrée : ${e.message}`);
        }
      }
      await pool.query('SET FOREIGN_KEY_CHECKS = 1');
    } else {
      console.log('ℹ️  Matricule déjà en VARCHAR(50) (déjà appliqué)');
    }

    // ─── Rapport final ────────────────────────────────────────────
    const [cols] = await pool.query(`
      SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = ?
        AND TABLE_NAME IN ('paiement','session','anneeacademique','personne')
        AND COLUMN_NAME IN ('valide','idTranche','type_paiement','phone_paiement','date_passage','est_active','actif')
      ORDER BY TABLE_NAME, COLUMN_NAME
    `, [process.env.DB_NAME]);

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