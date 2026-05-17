require('dotenv').config();
const pool = require('./src/config/db');

async function seed() {
  try {
    // 1. Check if scolarite has data
    const [existing] = await pool.query('SELECT * FROM scolarite');
    let idSco;

    if (existing.length > 0) {
      console.log('Scolarite already has data:', existing.length, 'rows');
      idSco = existing[0].idScolarite;
    } else {
      // Create a default scolarite entry (no 'actif' column in this table)
      const [res] = await pool.query(
        `INSERT INTO scolarite (inscription, pension, nbreTranche, description, idCycle, idFondateur, created_at) 
         VALUES (50000, 200000, 3, 'Scolarite primaire 2025-2026', 1, 1, NOW())`
      );
      idSco = res.insertId;
      console.log('Created scolarite id:', idSco);
    }

    // 2. Check if tranches already exist
    const [existingTranches] = await pool.query('SELECT * FROM Tranches');
    if (existingTranches.length > 0) {
      console.log('Tranches already seeded:', existingTranches.length, 'rows');
      console.log(existingTranches);
      process.exit(0);
      return;
    }

    // 3. Seed 3 tranches
    const tranches = [
      ['Tranche 1', 80000, '10', '15'],
      ['Tranche 2', 70000, '01', '15'],
      ['Tranche 3', 50000, '03', '15'],
    ];

    for (const [lib, mt, mois, jour] of tranches) {
      await pool.query(
        'INSERT INTO Tranches (libelle, montant, delai_mois, delai_jour, idScolarite, actif, idFondateur) VALUES (?,?,?,?,?,1,1)',
        [lib, mt, mois, jour, idSco]
      );
    }
    console.log('Seeded 3 tranches successfully!');

    // 4. Verify
    const [verify] = await pool.query('SELECT * FROM Tranches');
    console.log('Tranches now:', verify);

    process.exit(0);
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

seed();
