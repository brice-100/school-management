require('dotenv').config();
const pool = require('./src/config/db');

async function test() {
  const id = 34; // TECLE MEAVA
  const currentAnnee = null;

  const matieresQuery = `
    SELECT DISTINCT c.idCours AS id, CONCAT(c.libelle, ' (', cl.libelle, ')') AS nom, cl.idClasse AS idClasse
    FROM Cours c
    JOIN Classe cl ON c.idClasse = cl.idClasse
    WHERE c.actif = 1
      AND (c.idAnnee = ? OR ? IS NULL)
      AND c.idCours IN (
        SELECT c2.idCours FROM Cours c2
        WHERE c2.idClasse IN (
          SELECT s.idClasse FROM Salle s
          WHERE s.idSalle IN (SELECT idSalle FROM Titulaire WHERE idPers = ? AND actif = 1)
        )
        UNION
        SELECT ens.idCours FROM Enseignant ens WHERE ens.idPers = ?
        UNION
        SELECT tm.matiere_id FROM teacher_matieres tm
        JOIN Enseignant ens2 ON ens2.idEnseignant = tm.teacher_id
        WHERE ens2.idPers = ?
      )
    ORDER BY nom ASC
  `;

  const [matieres] = await pool.query(matieresQuery, [currentAnnee, currentAnnee, id, id, id]);
  console.log('Matieres:');
  matieres.forEach(m => console.log('  ', m.id, ':', m.nom, '| Classe:', m.idClasse));
  process.exit(0);
}

test().catch(console.error);
