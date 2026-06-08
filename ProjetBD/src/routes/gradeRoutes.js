const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const evaluationModel = require('../models/evaluationModel');
const authMiddleware = require('../middleware/authMiddleware');
const validate = require('../middleware/validateMiddleware');

const router = express.Router();

router.use(authMiddleware.protect);

/**
 * GET /api/grades
 * Mappe vers evaluations
 */
router.get('/', asyncHandler(async (req, res) => {
  const { id, userType, role } = req.user;
  const pool = require('../config/db');

  // Résoudre idAnnee depuis le libellé si nécessaire
  let idAnnee = req.query.idAnnee ? parseInt(req.query.idAnnee) : null;
  if (!idAnnee && req.query.annee_scolaire) {
    const [anneeRows] = await pool.query(
      'SELECT idAnnee FROM AnneeAcademique WHERE libelle = ? LIMIT 1',
      [req.query.annee_scolaire]
    );
    if (anneeRows[0]) idAnnee = anneeRows[0].idAnnee;
  }

  const filters = {
    idClasse:  req.query.classe_id  || null,
    idCours:   req.query.matiere_id || null,
    idAnnee:   idAnnee,
    isDeleted: req.query.archives === '1' ? 1 : 0,
    // Pour un enseignant, ne retourner que ses propres notes
    idPers: (userType === 'personne' && role === 1) ? id : null,
  };

  const evaluations = await evaluationModel.findAll(filters);
  return res.status(200).json({ data: evaluations });
}));


/**
 * GET /api/grades/form-data
 */
router.get('/form-data', asyncHandler(async (req, res) => {
  const pool = require('../config/db');
  const { id, userType, role } = req.user;
  
  // Si c'est un enseignant, on filtre les élèves de ses classes et ses propres matières
  if (userType === 'personne' && role === 1) {
    const currentAnnee = parseInt(req.idAnnee) || null;

    // 1. Ses matières (principale + table teacher_matieres)
    const [matieres] = await pool.query(`
      SELECT DISTINCT c.idCours AS id, c.libelle AS nom
      FROM Cours c
      JOIN Enseignant ens ON ens.idPers = ?
      WHERE c.actif = 1
        AND (c.idAnnee = ? OR ? IS NULL)
        AND (
          c.idCours = ens.idCours
          OR c.idCours IN (
            SELECT tm.matiere_id
            FROM teacher_matieres tm
            WHERE tm.teacher_id = ens.idEnseignant
          )
        )
      ORDER BY c.libelle ASC
    `, [id, currentAnnee, currentAnnee]);

    // 2. Ses élèves (classes enseignées ou salle dont il est titulaire)
    const [students] = await pool.query(`
      SELECT DISTINCT e.matricule AS id, e.nom, e.prenom, CONCAT(cl.libelle, ' - ', s.libelle) AS classe_nom
      FROM Eleve e
      JOIN Frequente f ON e.matricule = f.matricule
      JOIN Salle s ON f.idSalle = s.idSalle
      JOIN Classe cl ON cl.idClasse = s.idClasse
      WHERE (
        s.idClasse IN (
          SELECT c.idClasse FROM Cours c
          JOIN Enseignant ens ON ens.idPers = ?
          WHERE c.idCours = ens.idCours
          UNION
          SELECT c2.idClasse FROM teacher_matieres tm
          JOIN Cours c2 ON c2.idCours = tm.matiere_id
          JOIN Enseignant ens2 ON ens2.idEnseignant = tm.teacher_id
          WHERE ens2.idPers = ?
        )
        OR s.idSalle IN (
          SELECT sa.idSalle FROM Titulaire ti
          JOIN Salle sa ON sa.idSalle = ti.idSalle
          WHERE ti.idPers = ?
        )
      )
      AND e.actif = 1 AND e.isDeleted = 0
      AND (f.idAcademi = ? OR ? IS NULL)
      ORDER BY e.nom ASC, e.prenom ASC
    `, [id, id, id, currentAnnee, currentAnnee]);

    const [epreuves] = await pool.query('SELECT idEpreuve as id, libelle as nom FROM Epreuve');
    const [sessions] = await pool.query('SELECT idSession as id, libelle as nom FROM Session');

    return res.status(200).json({ data: { students, matieres, epreuves, sessions } });
  }

  // Admin : tout voir
  const [students] = await pool.query('SELECT matricule as id, nom, prenom FROM Eleve WHERE actif = 1');
  const [matieres] = await pool.query(`
    SELECT c.idCours as id, c.libelle as nom 
    FROM Cours c
    WHERE c.actif = 1
  `);
  const [epreuves] = await pool.query('SELECT idEpreuve as id, libelle as nom FROM Epreuve');
  const [sessions] = await pool.query('SELECT idSession as id, libelle as nom FROM Session');
  
  return res.status(200).json({ data: { students, matieres, epreuves, sessions } });
}));

/**
 * POST /api/grades
 */
router.post('/', asyncHandler(async (req, res) => {
  const { student_id, matiere_id, valeur, commentaire, trimestre, idAnnee } = req.body;
  const idAnneeResolved = idAnnee || req.idAnnee || 1;

  // Résoudre l'ID de session quand le frontend ne fournit que le trimestre ordinal.
  let idSession = req.body.idSession ? parseInt(req.body.idSession, 10) : null;
  const trimestreOrdre = trimestre ? parseInt(trimestre, 10) : null;
  if (!idSession && trimestreOrdre) {
    const [trimestres] = await pool.query(
      `SELECT t.idTrimes
       FROM Trimestre t
       WHERE t.idAca = ?
       ORDER BY t.idTrimes ASC
       LIMIT 1 OFFSET ?`,
      [idAnneeResolved, Math.max(0, trimestreOrdre - 1)]
    );

    if (trimestres[0]) {
      const [sessions] = await pool.query(
        `SELECT s.idSession
         FROM Session s
         WHERE s.idTrimestre = ?
         ORDER BY s.idSession ASC
         LIMIT 1`,
        [trimestres[0].idTrimes]
      );
      if (sessions[0]) {
        idSession = sessions[0].idSession;
      }
    }
  }

  // Mapping vers evaluation
  const data = {
    note: valeur,
    appreciation: commentaire || '',
    matricule: student_id,
    idCours: matiere_id,
    idPers: req.user.id,
    idSession: idSession || 1,
    idAnnee: idAnneeResolved,
  };

  const idEval = await evaluationModel.create(data);
  const evaluation = await evaluationModel.findById(idEval);
  return res.status(201).json({ message: 'Note enregistrée', data: evaluation });
}));

/**
 * PATCH /api/grades/valider
 * Valider une liste de notes
 */
router.patch('/valider', asyncHandler(async (req, res) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids)) {
    return res.status(400).json({ message: 'Liste d\'identifiants invalide' });
  }
  await evaluationModel.valider(ids);
  return res.status(200).json({ message: `${ids.length} note(s) validée(s)` });
}));

/**
 * DELETE /api/grades/:id
 */

router.delete('/:id', asyncHandler(async (req, res) => {
  await evaluationModel.remove(parseInt(req.params.id));
  return res.status(200).json({ message: 'Note supprimée logiquement' });
}));

router.patch('/:id/restaurer', asyncHandler(async (req, res) => {
  await evaluationModel.restore(parseInt(req.params.id));
  return res.status(200).json({ message: 'Note restaurée avec succès' });
}));

module.exports = router;
