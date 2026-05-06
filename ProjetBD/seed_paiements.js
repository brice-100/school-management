require('dotenv').config();
const pool = require('./src/config/db');

async function seed() {
  try {
    console.log('--- Seeding Paiements ---');
    
    // 1. S'assurer qu'il y a un mode de paiement
    const [modes] = await pool.query("SELECT idMode FROM Mode LIMIT 1");
    let modeId = modes[0]?.idMode;
    if (!modeId) {
      const [resMode] = await pool.query("INSERT INTO Mode (libelle, information, actif, idFondateur) VALUES (?, ?, 1, 1)", ['Espèces', 'Paiement direct en caisse', 1]);
      modeId = resMode.insertId;
      console.log('✅ Mode créé ID:', modeId);
    }

    // 2. Récupérer un matricule d'élève (matricule 3 existe d'après mon inspection)
    const matricule = 3;
    const idAca = 1; // 2025-2026

    // 3. Insérer des paiements
    const payments = [
      { montant: 50000, type: 'cash', valide: 1, comment: 'Première tranche' },
      { montant: 25000, type: 'orange_money', valide: 0, comment: 'Acompte deuxième tranche' }
    ];

    for (const p of payments) {
      await pool.query(
        `INSERT INTO Paiement 
          (matricule, idAca, montant, comentaire, idMode, type_paiement, valide, idPers, datePaie, dateEnregistrer, operation_ID)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURDATE(), NOW(), ?)`,
        [matricule, idAca, p.montant, p.comment, modeId, p.type, p.valide, 1, `SEED-${Date.now()}`]
      );
    }

    console.log('✅ 2 paiements insérés pour le matricule 3');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
}

seed();
