require('dotenv').config();
const pool = require('./src/config/db');

async function migrate() {
  try {
    console.log('--- Migration Globale ---');
    
    const tables = [
      {
        name: 'Evaluation',
        columns: [
          { name: 'valider', sql: "ALTER TABLE Evaluation ADD COLUMN valider TINYINT(1) DEFAULT 0" }
        ]
      },
      {
        name: 'Paiement',
        columns: [
          { name: 'valide', sql: "ALTER TABLE Paiement ADD COLUMN valide TINYINT(1) DEFAULT 0" },
          { name: 'type_paiement', sql: "ALTER TABLE Paiement ADD COLUMN type_paiement VARCHAR(50) DEFAULT 'cash'" },
          { name: 'phone_paiement', sql: "ALTER TABLE Paiement ADD COLUMN phone_paiement VARCHAR(20)" },
          { name: 'idTranche', sql: "ALTER TABLE Paiement ADD COLUMN idTranche INT UNSIGNED" }
        ]
      }
    ];

    for (const t of tables) {
      console.log(`Vérification table ${t.name}...`);
      for (const col of t.columns) {
        const [existing] = await pool.query(
          "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = ? AND COLUMN_NAME = ? AND TABLE_SCHEMA = ?",
          [t.name, col.name, process.env.DB_NAME]
        );

        if (existing.length === 0) {
          try {
            await pool.query(col.sql);
            console.log(`✅ Ajouté : ${t.name}.${col.name}`);
          } catch (e) {
            console.error(`❌ Erreur ajout ${t.name}.${col.name}:`, e.message);
          }
        } else {
          console.log(`ℹ️ Déjà présent : ${t.name}.${col.name}`);
        }
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
