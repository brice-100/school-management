const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const evaluationModel = require('../models/evaluationModel');
const authMiddleware = require('../middleware/authMiddleware');
const validate = require('../middleware/validateMiddleware');

const router = express.Router();

router.use(authMiddleware);

/**
 * GET /api/grades
 * Mappe vers evaluations
 */
router.get('/', asyncHandler(async (req, res) => {
  // Convertir les filtres frontend (classe_id, matiere_id, trimestre) 
  // vers les filtres backend (idClasse, idCours, idSession)
  const filters = {
    idClasse: req.query.classe_id,
    idCours:  req.query.matiere_id,
    // Note: le frontend envoie 'trimestre' (1, 2, 3), 
    // le backend attend idSession. On peut faire une recherche si besoin.
  };
  const evaluations = await evaluationModel.findAll(filters);
  return res.status(200).json({ data: evaluations });
}));

/**
 * GET /api/grades/form-data
 */
router.get('/form-data', asyncHandler(async (req, res) => {
  const pool = require('../config/db');
  const [students] = await pool.query('SELECT matricule as id, nom, prenom FROM Eleve WHERE actif = 1');
  const [matieres] = await pool.query('SELECT idCours as id, libelle as nom FROM Cours WHERE actif = 1');
  const [epreuves] = await pool.query('SELECT idEpreuve as id, libelle as nom FROM Epreuve');
  const [sessions] = await pool.query('SELECT idSession as id, libelle as nom FROM Session');
  return res.status(200).json({ data: { students, matieres, epreuves, sessions } });
}));

/**
 * POST /api/grades
 */
router.post('/', asyncHandler(async (req, res) => {
  const { student_id, matiere_id, valeur, commentaire, trimestre } = req.body;
  
  // Mapping vers evaluation
  const data = {
    note: valeur,
    appreciation: commentaire || '',
    matricule: student_id,
    idCours: matiere_id,
    idPers: req.user.id,
    // On cherche une session par défaut pour le trimestre si idSession absent
    idSession: req.body.idSession || trimestre || 1 
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
  return res.status(200).json({ message: 'Note supprimée' });
}));

module.exports = router;
