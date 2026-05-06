require('dotenv').config();
const pool = require('./src/config/db');

async function inspect() {
  try {
    const [rows] = await pool.query("SELECT idPaie, matricule, idAca, montant, valide FROM Paiement LIMIT 10");
    console.log('--- Inspection Paiements ---');
    console.table(rows);
    
    const [counts] = await pool.query("SELECT idAca, COUNT(*) as count FROM Paiement GROUP BY idAca");
    console.log('--- Répartition par idAca ---');
    console.table(counts);

    const [years] = await pool.query("SELECT idAnnee, libelle FROM AnneeAcademique");
    console.log('--- Années Académiques ---');
    console.table(years);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

inspect();
