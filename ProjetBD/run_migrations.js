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

async function resolveTableName(pool, dbName, table) {
  const [rows] = await pool.query(
    `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = ? AND LOWER(TABLE_NAME) = LOWER(?) LIMIT 1`,
    [dbName, table]
  );
  return rows[0] ? rows[0].TABLE_NAME : null;
}

async function addColumnIfMissing(pool, table, column, definition, label) {
  const dbName = process.env.DB_NAME;
  const actualTable = await resolveTableName(pool, dbName, table);
  if (!actualTable) {
    console.log(`ℹ️  Table ${table} introuvable, ${label} ignorée`);
    return;
  }

  const [rows] = await pool.query(
    `SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [dbName, actualTable, column]
  );
  if (rows[0].cnt > 0) {
    console.log(`ℹ️  ${label} (déjà appliqué)`);
    return;
  }
  await pool.query(`ALTER TABLE \`${actualTable}\` ADD COLUMN \`${column}\` ${definition}`);
  console.log(`✅ ${label}`);
}

async function fixAutoIncrements(pool) {
  const tables = [
    ['Personne',    'idPers'],
    ['Eleve',       'idEleve'],
    ['Enseignant',  'idEnseignant'],
    ['Parents',     'idParent'],
    ['Classe',      'idClasse'],
    ['Paiement',    'idPaiement'],
    ['Cours',       'idCours'],
    ['Evaluation',  'idEvaluation'],
  ];

  await pool.query('SET FOREIGN_KEY_CHECKS = 0');
  for (const [table, col] of tables) {
    try {
      const actualTable = await resolveTableName(pool, process.env.DB_NAME, table);
      if (!actualTable) {
        console.log(`ℹ️  Table ${table} introuvable, ignorée`);
        continue;
      }

      // Récupère le type actuel de la colonne
      const [rows] = await pool.query(
        `SELECT COLUMN_TYPE, EXTRA FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
        [process.env.DB_NAME, actualTable, col]
      );
      if (!rows.length) {
        console.log(`ℹ️  Colonne ${col} introuvable sur ${actualTable}, ignorée`);
        continue;
      }
      if (rows[0].EXTRA.includes('auto_increment')) {
        console.log(`ℹ️  ${actualTable}.${col} AUTO_INCREMENT déjà présent`);
        continue;
      }
      const colType = rows[0].COLUMN_TYPE;
      await pool.query(
        `ALTER TABLE \`${actualTable}\` MODIFY \`${col}\` ${colType} NOT NULL AUTO_INCREMENT`
      );
      console.log(`✅ AUTO_INCREMENT ajouté sur ${actualTable}.${col}`);
    } catch (err) {
      console.log(`ℹ️  ${table}.${col} → ${err.message}`);
    }
  }
  await pool.query('SET FOREIGN_KEY_CHECKS = 1');
  console.log('✅ AUTO_INCREMENT vérifié sur toutes les tables');
}

async function seedAdmin(pool) {
  const bcrypt = require('bcryptjs');
  const [rows] = await pool.query('SELECT ID FROM Admin WHERE typeAdmin = 0 LIMIT 1');
  if (rows.length === 0) {
    const hash = await bcrypt.hash(process.env.ADMIN_DEFAULT_PASSWORD, 10);
    await pool.query(
      `INSERT INTO Admin (ID, nom, username, password, typeAdmin, mobile, alanyaID, created_at)
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

    // ─── 4. Données initiales ─────────────────────────────────────
    await runSql(pool, `
      INSERT IGNORE INTO Mode (idMode, libelle, information, actif, idFondateur, created_at)
      VALUES
        (1, 'Cash',              'Paiement en espèces directement à l''école', 1, 1, NOW()),
        (2, 'Mobile Money',      'Paiement via MTN Mobile Money',               1, 1, NOW()),
        (3, 'Orange Money',      'Paiement via Orange Money',                   1, 1, NOW()),
        (4, 'Virement bancaire', 'Virement bancaire classique',                 1, 1, NOW())
    `, 'Données initiales Mode');

    await runSql(pool, `
      INSERT IGNORE INTO NatureEpreuve (idNature, libelle, description)
      VALUES
        (1, 'Contrôle Continu', 'Évaluation continue en classe'),
        (2, 'Examen',           'Examen trimestriel ou semestriel'),
        (3, 'Devoir Maison',    'Devoir à réaliser à la maison'),
        (4, 'Interrogation',    'Interrogation surprise')
    `, 'Données initiales NatureEpreuve');

    await runSql(pool, `
      UPDATE AnneeAcademique SET est_active = 1
      WHERE idAnnee = (SELECT MAX(idAnnee) FROM (SELECT idAnnee FROM AnneeAcademique) AS sub)
        AND NOT EXISTS (
          SELECT 1 FROM (SELECT COUNT(*) as cnt FROM AnneeAcademique WHERE est_active = 1) AS chk
          WHERE cnt > 0
        )
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

    // ─── 5. Migration matricule INT → VARCHAR(50) ─────────────────
    const actualEleveTable = await resolveTableName(pool, process.env.DB_NAME, 'Eleve');
    const [eleveMatCol] = await pool.query(
      `SELECT DATA_TYPE FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = 'matricule'`,
      [process.env.DB_NAME, actualEleveTable || 'Eleve']
    );
    const currentType = eleveMatCol[0]?.DATA_TYPE?.toLowerCase() || '';

    if (currentType !== 'varchar') {
      console.log('🔄 Conversion matricule INT → VARCHAR(50)...');
      await pool.query('SET FOREIGN_KEY_CHECKS = 0');
      const fksToDrop = [
        { table: 'Evaluation', fk: 'matr'   },
        { table: 'Frequente',  fk: 'freq'   },
        { table: 'Paiement',   fk: 'enf'    },
        { table: 'Parents',    fk: 'enft'   },
        { table: 'Rapport',    fk: 'enfant' },
      ];
      for (const { table, fk } of fksToDrop) {
        const actualTable = await resolveTableName(pool, process.env.DB_NAME, table) || table;
        try {
          await pool.query(`ALTER TABLE \`${actualTable}\` DROP FOREIGN KEY \`${fk}\``);
        } catch { /* FK peut ne pas exister */ }
      }
      for (const table of ['Eleve', 'Evaluation', 'Frequente', 'Paiement', 'Parents', 'Rapport']) {
        const actualTable = await resolveTableName(pool, process.env.DB_NAME, table) || table;
        await runSql(pool,
          `ALTER TABLE \`${actualTable}\` MODIFY matricule VARCHAR(50) NOT NULL`,
          `Matricule VARCHAR(50) sur ${actualTable}`);
      }
      const fksToCreate = [
        { table: 'Evaluation', fk: 'matr',   ref: 'Eleve', col: 'matricule' },
        { table: 'Frequente',  fk: 'freq',   ref: 'Eleve', col: 'matricule' },
        { table: 'Paiement',   fk: 'enf',    ref: 'Eleve', col: 'matricule' },
        { table: 'Parents',    fk: 'enft',   ref: 'Eleve', col: 'matricule' },
        { table: 'Rapport',    fk: 'enfant', ref: 'Eleve', col: 'matricule' },
      ];
      for (const { table, fk, ref, col } of fksToCreate) {
        const actualTable = await resolveTableName(pool, process.env.DB_NAME, table) || table;
        const actualRef = await resolveTableName(pool, process.env.DB_NAME, ref) || ref;
        try {
          await pool.query(
            `ALTER TABLE \`${actualTable}\` ADD CONSTRAINT \`${fk}\`
             FOREIGN KEY (\`matricule\`) REFERENCES \`${actualRef}\`(\`${col}\`)
             ON DELETE NO ACTION ON UPDATE CASCADE`
          );
          console.log(`✅ FK ${fk} recrée sur ${actualTable}`);
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
        AND TABLE_NAME IN ('Paiement','Session','AnneeAcademique','Personne')
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