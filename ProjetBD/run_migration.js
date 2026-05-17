const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  console.log('--- DÉMARRAGE DE LA MIGRATION MATRICULE (FORCING COLLATION) ---');
  
  const connection = await mysql.createConnection({
    host:     process.env.DB_HOST || 'localhost',
    user:     process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'school_db',
    port:     parseInt(process.env.DB_PORT) || 3306
  });

  const runSql = async (sql) => {
    try {
      await connection.query(sql);
    } catch (e) {
      console.warn(`[WARN] Échec : ${sql.substring(0, 50)}... -> ${e.message}`);
    }
  };

  try {
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');

    // 1. Drop
    await runSql('ALTER TABLE Evaluation DROP FOREIGN KEY matr');
    await runSql('ALTER TABLE Frequente  DROP FOREIGN KEY freq');
    await runSql('ALTER TABLE Paiement   DROP FOREIGN KEY enf');
    await runSql('ALTER TABLE Parents    DROP FOREIGN KEY enft');
    await runSql('ALTER TABLE Rapport    DROP FOREIGN KEY enfant');

    // 2. Modify with forced collation
    const type = 'VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci';
    await runSql(`ALTER TABLE Eleve      MODIFY matricule ${type} NOT NULL`);
    await runSql(`ALTER TABLE Evaluation MODIFY matricule ${type} NOT NULL`);
    await runSql(`ALTER TABLE Frequente  MODIFY matricule ${type} NOT NULL`);
    await runSql(`ALTER TABLE Paiement   MODIFY matricule ${type} NOT NULL`);
    await runSql(`ALTER TABLE Parents    MODIFY matricule ${type} NOT NULL`);
    await runSql(`ALTER TABLE Rapport    MODIFY matricule ${type} NOT NULL`);

    // 3. Add
    await runSql('ALTER TABLE Evaluation ADD CONSTRAINT matr   FOREIGN KEY (matricule) REFERENCES Eleve(matricule) ON UPDATE CASCADE');
    await runSql('ALTER TABLE Frequente  ADD CONSTRAINT freq   FOREIGN KEY (matricule) REFERENCES Eleve(matricule) ON UPDATE CASCADE');
    await runSql('ALTER TABLE Paiement   ADD CONSTRAINT enf    FOREIGN KEY (matricule) REFERENCES Eleve(matricule) ON UPDATE CASCADE');
    await runSql('ALTER TABLE Parents    ADD CONSTRAINT enft   FOREIGN KEY (matricule) REFERENCES Eleve(matricule) ON UPDATE CASCADE');
    await runSql('ALTER TABLE Rapport    ADD CONSTRAINT enfant FOREIGN KEY (matricule) REFERENCES Eleve(matricule) ON UPDATE CASCADE');

    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    
    console.log('✅ Migration avec collation forcée terminée !');
  } catch (err) {
    console.error('❌ Erreur critique :', err.message);
  } finally {
    await connection.end();
    process.exit();
  }
}

run();
