require('dotenv').config();
const pool = require('./src/config/db');

async function audit() {
  console.log('=== AUDIT COMPLET ENSEIGNANTS ===\n');

  const [teachers] = await pool.query(`
    SELECT e.idEnseignant, p.nom, p.prenom, p.idPers,
      c.libelle AS cours_principal, cl.libelle AS classe_principale, cl.idClasse AS idClasse_principal
    FROM Enseignant e
    JOIN Personne p ON e.idPers = p.idPers
    LEFT JOIN Cours c ON e.idCours = c.idCours
    LEFT JOIN Classe cl ON c.idClasse = cl.idClasse
    WHERE e.isDeleted = 0 AND p.typePersonne = 1
    ORDER BY p.nom
  `);

  const [titulaires] = await pool.query(`
    SELECT t.idPers, s.libelle AS salle, cl.libelle AS classe, cl.idClasse
    FROM Titulaire t
    JOIN Salle s ON t.idSalle = s.idSalle
    JOIN Classe cl ON s.idClasse = cl.idClasse
    WHERE t.actif = 1
  `);
  const titulaireMap = {};
  titulaires.forEach(t => {
    if (!titulaireMap[t.idPers]) titulaireMap[t.idPers] = [];
    titulaireMap[t.idPers].push({ salle: t.salle, classe: t.classe, idClasse: t.idClasse });
  });

  const [allCours] = await pool.query(`
    SELECT c.idCours, c.libelle, cl.idClasse, cl.libelle AS classe
    FROM Cours c JOIN Classe cl ON c.idClasse = cl.idClasse WHERE c.actif = 1
  `);
  const coursByClasse = {};
  allCours.forEach(c => {
    if (!coursByClasse[c.idClasse]) coursByClasse[c.idClasse] = [];
    coursByClasse[c.idClasse].push({ id: c.idCours, libelle: c.libelle });
  });

  for (const t of teachers) {
    const [matieres] = await pool.query(`
      SELECT tm.matiere_id, c.libelle, cl.libelle AS classe, cl.idClasse
      FROM teacher_matieres tm
      JOIN Cours c ON c.idCours = tm.matiere_id
      JOIN Classe cl ON cl.idClasse = c.idClasse
      WHERE tm.teacher_id = ?
    `, [t.idEnseignant]);

    const classesTitulaireList = titulaireMap[t.idPers] || [];

    console.log(`👨‍🏫 ${t.nom} ${t.prenom}`);
    if (classesTitulaireList.length > 0) {
      classesTitulaireList.forEach(tit => {
        const coursDispos = coursByClasse[tit.idClasse] || [];
        const coursEnseignant = matieres.filter(m => m.idClasse === tit.idClasse);
        console.log(`   📌 Titulaire: ${tit.classe} (${tit.salle})`);
        console.log(`      Cours dispo en ${tit.classe}: ${coursDispos.map(c => c.libelle).join(', ') || 'AUCUN'}`);
        console.log(`      Cours assignés à cet enseignant en ${tit.classe}: ${coursEnseignant.map(m => m.libelle).join(', ') || '⚠️ AUCUN'}`);
        const manquants = coursDispos.filter(c => !coursEnseignant.find(m => m.matiere_id === c.id));
        if (manquants.length > 0) {
          console.log(`      ❌ Manquants: ${manquants.map(c => c.libelle).join(', ')}`);
        }
      });
    } else {
      console.log(`   ℹ️  Non-Titulaire (itinérant)`);
    }
    console.log(`   Toutes ses matières (teacher_matieres): ${matieres.map(m => m.libelle + ' (' + m.classe + ')').join(', ') || 'aucune'}`);
    console.log('');
  }

  // Résumé cours par classe
  console.log('=== COURS EXISTANTS PAR CLASSE ===');
  const [allClasses] = await pool.query('SELECT idClasse, libelle FROM Classe ORDER BY libelle');
  allClasses.forEach(cl => {
    const cs = coursByClasse[cl.idClasse] || [];
    console.log(`  ${cl.libelle}: ${cs.map(c => c.libelle + ' (id:' + c.id + ')').join(', ') || 'AUCUN COURS'}`);
  });

  process.exit(0);
}

audit().catch(console.error);
