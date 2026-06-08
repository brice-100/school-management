const asyncHandler = require('../utils/asyncHandler');
const pool = require('../config/db');

/**
 * GET /api/stats/overview
 * Statistiques globales réelles de la plateforme
 */
const getOverview = asyncHandler(async (req, res) => {
  const idAnnee = req.query.idAnnee || null;

  const [[{ totalEleves }]]     = await pool.query('SELECT COUNT(*) as totalEleves FROM Eleve WHERE actif = 1');
  const [[{ totalEnseignants }]] = await pool.query(`SELECT COUNT(DISTINCT idPers) as totalEnseignants FROM Enseignant`);
  const [[{ totalClasses }]]    = await pool.query('SELECT COUNT(*) as totalClasses FROM Classe');
  const [[{ totalParents }]]    = await pool.query('SELECT COUNT(*) as totalParents FROM Personne WHERE typePersonne = 4');
  const [[{ pendingPersons }]]  = await pool.query('SELECT COUNT(*) as pendingPersons FROM Personne WHERE actif = 0');

  let revenueQuery = 'SELECT COALESCE(SUM(montant), 0) as revenue FROM Paiement WHERE valide = 1';
  const revenueParams = [];
  if (idAnnee) { revenueQuery += ' AND idAca = ?'; revenueParams.push(idAnnee); }
  const [[{ revenue }]] = await pool.query(revenueQuery, revenueParams);

  const [[{ enAttente }]] = await pool.query('SELECT COUNT(*) as enAttente FROM Paiement WHERE valide = 0');
  const [[{ totalEvaluations }]] = await pool.query('SELECT COUNT(*) as totalEvaluations FROM Evaluation');

  // Calcul dynamique du total attendu basé sur la table scolarite
  let attenduQuery = `
    SELECT COALESCE(SUM(s.inscription + s.pension), 0) as totalAttendu
    FROM Eleve e
    JOIN Frequente f ON e.matricule = f.matricule
    JOIN Salle sa ON f.idSalle = sa.idSalle
    JOIN Classe c ON sa.idClasse = c.idClasse
    JOIN Scolarite s ON s.idCycle = c.idCycle
    WHERE e.actif = 1
  `;
  const attenduParams = [];
  if (idAnnee) {
    attenduQuery += ' AND f.idAcademi = ?';
    attenduParams.push(idAnnee);
  }
  const [[{ totalAttendu }]] = await pool.query(attenduQuery, attenduParams);

  const total_attendu = parseFloat(totalAttendu);
  const taux_collecte = total_attendu > 0 ? Math.round((revenue / total_attendu) * 100) : 0;
  
  // Calcul de la moyenne générale et du taux de réussite réels
  let academicQuery = `
    SELECT 
      AVG(ev.note) as moyenneGale,
      COUNT(DISTINCT ev.matricule) as nbElevesEvalues
    FROM Evaluation ev
    JOIN Session s ON ev.idSession = s.idSession
    JOIN Trimestre t ON s.idTrimestre = t.idTrimes
    WHERE 1=1
  `;
  const academicParams = [];
  if (idAnnee) {
    academicQuery += ' AND t.idAca = ?';
    academicParams.push(idAnnee);
  }
  const [[{ moyenneGale, nbElevesEvalues }]] = await pool.query(academicQuery, academicParams);

  // Calcul du taux de réussite (élèves avec moyenne >= 10)
  let reussiteQuery = `
    SELECT COUNT(*) as nbAdmis FROM (
      SELECT ev.matricule, AVG(ev.note) as moy
      FROM Evaluation ev
      JOIN Session s ON ev.idSession = s.idSession
      JOIN Trimestre t ON s.idTrimestre = t.idTrimes
      WHERE 1=1
      ${idAnnee ? ' AND t.idAca = ?' : ''}
      GROUP BY ev.matricule
      HAVING moy >= 10
    ) as sub
  `;
  const [[{ nbAdmis }]] = await pool.query(reussiteQuery, idAnnee ? [idAnnee] : []);

  const moyenne_generale = parseFloat(moyenneGale || 0).toFixed(2);
  const taux_reussite = nbElevesEvalues > 0 ? Math.round((nbAdmis / nbElevesEvalues) * 100) : 0;
  const nb_echec = nbElevesEvalues - nbAdmis;

  return res.status(200).json({
    data: {
      students:         totalEleves,
      teachers:         totalEnseignants,
      classes:          totalClasses,
      parents:          totalParents,
      revenue:          parseFloat(revenue),
      total_paye:       parseFloat(revenue),
      total_attendu:    total_attendu,
      taux_collecte:    taux_collecte,
      taux_reussite:    taux_reussite,
      moyenne_generale: moyenne_generale,
      nb_admis:         nbAdmis,
      nb_echec:         nb_echec >= 0 ? nb_echec : 0,
      pending_accounts: enAttente,
      pending_users:    pendingPersons,
      totalEvaluations: totalEvaluations,
    }
  });
});

/**
 * GET /api/stats/notes-by-classe
 * Moyenne des notes par classe
 */
const getNotesByClasse = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(`
    SELECT c.libelle as classe, ROUND(AVG(ev.note), 2) as moyenne, COUNT(ev.idEval) as total_notes
    FROM Evaluation ev
    JOIN Cours co ON ev.idCours = co.idCours
    JOIN Classe c ON co.idClasse = c.idClasse
    GROUP BY c.idClasse, c.libelle
    ORDER BY moyenne DESC
  `);
  return res.status(200).json({ data: rows });
});

/**
 * GET /api/stats/notes-by-matiere
 * Moyenne des notes par matière
 */
const getNotesByMatiere = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(`
    SELECT co.libelle as matiere, ROUND(AVG(ev.note), 2) as moyenne, COUNT(ev.idEval) as total_notes
    FROM Evaluation ev
    JOIN Cours co ON ev.idCours = co.idCours
    GROUP BY co.idCours, co.libelle
    ORDER BY moyenne DESC
    LIMIT 20
  `);
  return res.status(200).json({ data: rows });
});

/**
 * GET /api/stats/payments-by-month
 */
const getPaymentsByMonth = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(`
    SELECT
      DATE_FORMAT(dateEnregistrer, '%M') as mois,
      SUM(montant) as paye,
      SUM(montant) as attendu
    FROM Paiement
    WHERE valide = 1
    GROUP BY DATE_FORMAT(dateEnregistrer, '%M'), MONTH(dateEnregistrer)
    ORDER BY MONTH(dateEnregistrer)
  `);
  return res.status(200).json({ data: rows });
});

/**
 * GET /api/stats/payments-by-statut
 */
const getPaymentsByStatut = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(`
    SELECT
      CASE WHEN valide = 1 THEN 'Validé' ELSE 'En attente' END as name,
      COUNT(*) as value
    FROM Paiement
    GROUP BY valide
  `);
  return res.status(200).json({ data: rows });
});

/**
 * GET /api/stats/reussite-by-trimestre
 */
const getReussiteByTrimestre = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(`
    SELECT
      s.libelle as trimestre,
      ROUND(AVG(ev.note), 2) as moyenne,
      ROUND(SUM(CASE WHEN ev.note >= 10 THEN 1 ELSE 0 END) * 100 / COUNT(*), 1) as taux
    FROM Evaluation ev
    JOIN Session s ON ev.idSession = s.idSession
    GROUP BY s.idSession, s.libelle
    ORDER BY s.idSession ASC
  `);
  return res.status(200).json({ data: rows });
});

/**
 * GET /api/stats/teachers-recap
 */
const getTeachersRecap = asyncHandler(async (req, res) => {
  const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');
  const currentYear  = new Date().getFullYear();

  const [rows] = await pool.query(`
    SELECT
      p.prenom, p.nom, p.username as email,
      c.libelle as classe_nom,
      GROUP_CONCAT(DISTINCT co.libelle ORDER BY co.libelle SEPARATOR ', ') as matieres,
      COUNT(DISTINCT ev.idEval) as nb_notes,
      COALESCE(ROUND(AVG(ev.note), 2), 0) as moyenne_notes,
      sa.statut as salaire_statut,
      sa.montant as salaire_montant
    FROM Enseignant en
    JOIN Personne p ON en.idPers = p.idPers
    LEFT JOIN (
      SELECT en2.idEnseignant, co2.idCours, co2.libelle, co2.idClasse
      FROM Enseignant en2
      JOIN Cours co2 ON co2.idCours = en2.idCours
      WHERE en2.idCours IS NOT NULL
      UNION
      SELECT tm.teacher_id, co3.idCours, co3.libelle, co3.idClasse
      FROM teacher_matieres tm
      JOIN Cours co3 ON co3.idCours = tm.matiere_id
    ) co ON co.idEnseignant = en.idEnseignant
    LEFT JOIN Classe c ON co.idClasse = c.idClasse
    LEFT JOIN Evaluation ev ON ev.idCours = co.idCours AND ev.idPers = en.idPers
    LEFT JOIN Salaires sa ON sa.teacher_id = en.idPers AND sa.mois = ? AND sa.annee = ?
    WHERE en.Actif = 1
    GROUP BY en.idPers, p.prenom, p.nom, p.username, c.libelle, sa.statut, sa.montant
    ORDER BY p.nom ASC
    LIMIT 20
  `, [currentMonth, currentYear]);
  return res.status(200).json({ data: rows });
});

module.exports = {
  getOverview,
  getNotesByClasse,
  getNotesByMatiere,
  getPaymentsByMonth,
  getPaymentsByStatut,
  getReussiteByTrimestre,
  getTeachersRecap
};
