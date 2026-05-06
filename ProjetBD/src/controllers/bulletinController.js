const asyncHandler = require('../utils/asyncHandler');
const pool = require('../config/db');

const getBulletinData = asyncHandler(async (req, res) => {
  const matricule = parseInt(req.params.id);
  const trimestre = req.query.trimestre || 1;
  const annee_scolaire = req.query.annee_scolaire || '2024-2025';

  const [students] = await pool.query(`
    SELECT 
      e.nom, e.prenom, e.photoURL as photo, e.dateNaissance as date_naissance, 
      c.libelle as classe_nom, 
      p.nom as parent_nom, p.prenom as parent_prenom, p.mobile as telephone
    FROM Eleve e
    LEFT JOIN Frequente f ON f.matricule = e.matricule
    LEFT JOIN Salle s ON s.idSalle = f.idSalle
    LEFT JOIN Classe c ON c.idClasse = s.idClasse
    LEFT JOIN Parents pr ON pr.matricule = e.matricule
    LEFT JOIN Personne p ON p.idPers = pr.idPers
    WHERE e.matricule = ? LIMIT 1
  `, [matricule]);

  if (students.length === 0) return res.status(404).json({ message: 'Élève introuvable' });
  const student = students[0];

  const [evals] = await pool.query(`
    SELECT 
      ev.idEval as id, ev.note as valeur, ev.appreciation as commentaire, 
      c.libelle as matiere_nom, 
      p.nom as teacher_nom, p.prenom as teacher_prenom,
      'valide' as statut
    FROM Evaluation ev
    JOIN Cours c ON ev.idCours = c.idCours
    JOIN Personne p ON ev.idPers = p.idPers
    JOIN Session s ON ev.idSession = s.idSession
    JOIN Trimestre t ON s.idTrimestre = t.idTrimes
    JOIN AnneeAcademique aa ON t.idAca = aa.idAnnee
    WHERE ev.matricule = ? 
    AND t.idTrimes = ? 
    AND aa.libelle = ?
  `, [matricule, trimestre, annee_scolaire]);

  let sum = 0;
  evals.forEach(ev => sum += parseFloat(ev.valeur) || 0);
  const count = evals.length;
  const moyenne = count > 0 ? (sum / count).toFixed(2) : null;
  
  let mention = '—';
  if (moyenne !== null) {
    const m = parseFloat(moyenne);
    if (m >= 16) mention = 'Très Bien';
    else if (m >= 14) mention = 'Bien';
    else if (m >= 12) mention = 'Assez Bien';
    else if (m >= 10) mention = 'Passable';
    else mention = 'Insuffisant';
  }

  return res.status(200).json({
    data: {
      trimestre,
      annee_scolaire,
      student,
      moyenne,
      mention,
      admis: moyenne !== null && parseFloat(moyenne) >= 10,
      nb_matieres: count,
      notes: evals
    }
  });
});

const downloadBulletinPDF = asyncHandler(async (req, res) => res.status(200).send('PDF placeholder'));

module.exports = { getBulletinData, downloadBulletinPDF };
