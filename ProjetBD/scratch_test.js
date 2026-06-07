require('dotenv').config();
const pool = require('./src/config/db');

const getSituationFinanciere = async () => {
  try {
    const idAca = 2; // Simulating selectedYear
    const [rows] = await pool.query(`
      SELECT 
        e.matricule,
        CONCAT(e.prenom, ' ', e.nom) as nomEleve,
        c.libelle as classe,
        c.idClasse,
        COALESCE(c.inscription, s.inscription, 0) + 
          (COALESCE(c.pension, s.pension, 0) * COALESCE(s.nbreTranche, 3)) as total_annuel_du,
        COALESCE(
          (SELECT SUM(pa.montant) FROM paiement pa 
           WHERE pa.matricule = e.matricule AND pa.valide = 1 AND pa.isDeleted = 0
           ${idAca ? 'AND pa.idAca = ' + pool.escape(idAca) : ''}),
          0
        ) as total_paye
      FROM Eleve e
      JOIN Frequente f ON e.matricule = f.matricule
      JOIN Salle sa ON f.idSalle = sa.idSalle
      JOIN Classe c ON sa.idClasse = c.idClasse
      LEFT JOIN Scolarite s ON s.idCycle = c.idCycle
      WHERE e.actif = 1
      ${idAca ? 'AND f.idAcademi = ' + pool.escape(idAca) : ''}
    `);

    for(let i = 0; i < rows.length; i++) {
      let r = rows[i];
      r.total_annuel_du = parseFloat(r.total_annuel_du);
      r.total_paye = parseFloat(r.total_paye);
      r.reste_a_payer = r.total_annuel_du - r.total_paye;

      const [tranches] = await pool.query(`
        SELECT t.libelle
        FROM paiement p
        JOIN Tranches t ON p.idTranche = t.idTranche
        WHERE p.matricule = ? AND p.valide = 1 AND p.isDeleted = 0 AND p.idTranche IS NOT NULL
        ${idAca ? 'AND p.idAca = ' + pool.escape(idAca) : ''}
      `, [r.matricule]);
      
      const uniqueTranches = [...new Set(tranches.map(t => t.libelle))];
      r.tranches_payees = uniqueTranches.join(', ') || 'Aucune';
    }
    
    console.log("SUCCESS, found", rows.length);
  } catch (e) {
    console.error("ERREUR DETECTEE:", e.message);
    console.error(e.stack);
  } finally {
    process.exit();
  }
};

getSituationFinanciere();
