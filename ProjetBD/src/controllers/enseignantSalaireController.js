const asyncHandler = require('../utils/asyncHandler');
const salaireModel = require('../models/salaireModel');
const pool = require('../config/db');

const getSalaireHistorique = asyncHandler(async (req, res) => {
  // Récupérer l'idEnseignant à partir de l'idPers de l'utilisateur connecté
  const [enseignants] = await pool.query('SELECT idEnseignant FROM Enseignant WHERE idPers = ?', [req.user.id]);
  if (enseignants.length === 0) return res.status(200).json({ data: [] });
  
  const idEnseignant = enseignants[0].idEnseignant;
  const salaires = await salaireModel.findAll({ teacher_id: idEnseignant });
  
  // Mapper pour le frontend (SalaryTeacherPage attend idRap, points, event_date, libelle)
  const mapped = salaires.map(s => ({
    idRap: s.id,
    points: s.montant,
    event_date: s.date_paiement || s.created_at,
    statut: s.statut,
    libelle: `Salaire ${s.mois}/${s.annee}`,
    commentaire: s.commentaire || ''
  }));
  
  res.status(200).json({ data: mapped });
});

const getSalaireStatut = asyncHandler(async (req, res) => {
  const [enseignants] = await pool.query('SELECT idEnseignant FROM Enseignant WHERE idPers = ?', [req.user.id]);
  if (enseignants.length === 0) return res.status(200).json({ data: null });
  
  const idEnseignant = enseignants[0].idEnseignant;
  const now = new Date();
  const mois = String(now.getMonth() + 1).padStart(2, '0');
  const annee = String(now.getFullYear());
  
  const salaires = await salaireModel.findAll({ teacher_id: idEnseignant, mois, annee });
  res.status(200).json({ data: salaires[0] || null });
});

const demanderDecaissement = asyncHandler(async (req, res) => {
  res.status(200).json({ message: 'Demande de décaissement envoyée' });
});

module.exports = { getSalaireHistorique, getSalaireStatut, demanderDecaissement };
