require('dotenv').config();
const pool = require('./src/config/db');

async function migrate() {
  try {
    console.log('--- Migration Paiement ---');
    
    const columnsToAdd = [
      { name: 'valide',        sql: "ALTER TABLE Paiement ADD COLUMN valide TINYINT(1) DEFAULT 0" },
      { name: 'type_paiement',  sql: "ALTER TABLE Paiement ADD COLUMN type_paiement VARCHAR(50) DEFAULT 'cash'" },
      { name: 'phone_paiement', sql: "ALTER TABLE Paiement ADD COLUMN phone_paiement VARCHAR(20)" },
      { name: 'idTranche',      sql: "ALTER TABLE Paiement ADD COLUMN idTranche INT UNSIGNED" }
    ];

    for (const col of columnsToAdd) {
      const [existing] = await pool.query(
        "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Paiement' AND COLUMN_NAME = ? AND TABLE_SCHEMA = ?",
        [col.name, process.env.DB_NAME]
      );

      if (existing.length === 0) {
        await pool.query(col.sql);
        console.log(`✅ Ajouté : ${col.name}`);
      } else {
        console.log(`ℹ️ Déjà présent : ${col.name}`);
      }
    }

    console.log('--- Migration terminée ---');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
