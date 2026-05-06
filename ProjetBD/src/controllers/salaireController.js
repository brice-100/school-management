const asyncHandler = require('../utils/asyncHandler');
const salaireModel = require('../models/salaireModel');

const getAll = asyncHandler(async (req, res) => {
  const salaires = await salaireModel.findAll(req.query);
  return res.status(200).json({ total: salaires.length, data: salaires });
});

const getRecap = asyncHandler(async (req, res) => {
  const recap = await salaireModel.getRecap(req.query);
  return res.status(200).json({ data: recap });
});

const getOne = asyncHandler(async (req, res) => {
  const salaire = await salaireModel.findById(parseInt(req.params.id));
  if (!salaire) return res.status(404).json({ message: 'Salaire introuvable' });
  return res.status(200).json({ data: salaire });
});

const createFiche = asyncHandler(async (req, res) => {
  const idFiche = await salaireModel.create(req.body);
  const fiche = await salaireModel.findById(idFiche);
  return res.status(201).json({ message: 'Fiche créée', data: fiche });
});

const updateFiche = asyncHandler(async (req, res) => {
  const idFiche = parseInt(req.params.id);
  await salaireModel.update(idFiche, req.body);
  const fiche = await salaireModel.findById(idFiche);
  return res.status(200).json({ message: 'Fiche modifiée', data: fiche });
});

const payer = asyncHandler(async (req, res) => {
  const idFiche = parseInt(req.params.id);
  await salaireModel.update(idFiche, { 
    statut: 'paye', 
    date_paiement: new Date().toISOString().split('T')[0] 
  });
  return res.status(200).json({ message: 'Salaire marqué comme payé' });
});

const genererMois = asyncHandler(async (req, res) => {
  // Logique simplifiée pour l'instant : on pourrait boucler sur les enseignants
  // et appeler salaireModel.create pour chacun.
  return res.status(200).json({ message: 'Fonctionnalité de génération automatique à venir.' });
});

module.exports = { getAll, getRecap, getOne, createFiche, updateFiche, payer, genererMois };
