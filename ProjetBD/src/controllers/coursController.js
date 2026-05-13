// src/controllers/coursController.js
const asyncHandler = require('../utils/asyncHandler');
const coursModel = require('../models/coursModel');

const getAll = asyncHandler(async (req, res) => {
  const filters = {};
  if (req.query.actif !== undefined) filters.actif = parseInt(req.query.actif);
  if (req.query.idAnnee) filters.idAnnee = parseInt(req.query.idAnnee);
  const cours = await coursModel.findAll(filters);
  return res.status(200).json({ total: cours.length, data: cours });
});

const getMesCours = asyncHandler(async (req, res) => {
  const cours = await coursModel.findMesCours(req.user.idPers);
  return res.status(200).json({ total: cours.length, data: cours });
});

const getOne = asyncHandler(async (req, res) => {
  const cours = await coursModel.findById(parseInt(req.params.id));
  if (!cours) return res.status(404).json({ message: 'Cours introuvable' });
  return res.status(200).json({ data: cours });
});

const create = asyncHandler(async (req, res) => {
  let idAnnee = req.body.idAnnee;
  if (!idAnnee) {
    const pool = require('../config/db');
    const [annees] = await pool.query('SELECT idAnnee FROM AnneeAcademique WHERE est_active = 1 LIMIT 1');
    idAnnee = annees.length > 0 ? annees[0].idAnnee : 1;
  }
  const data = { ...req.body, idAdmin: req.user.id, idAnnee };
  const idCours = await coursModel.create(data);
  const cours = await coursModel.findById(idCours);
  return res.status(201).json({ message: 'Cours créé', data: cours });
});

const update = asyncHandler(async (req, res) => {
  const idCours = parseInt(req.params.id);
  await coursModel.update(idCours, req.body);
  const cours = await coursModel.findById(idCours);
  return res.status(200).json({ message: 'Cours modifié', data: cours });
});

const updateStatut = asyncHandler(async (req, res) => {
  const idCours = parseInt(req.params.id);
  const actif = parseInt(req.body.actif);
  await coursModel.setActif(idCours, actif);
  return res.status(200).json({ message: 'Statut du cours modifié' });
});

const remove = asyncHandler(async (req, res) => {
  await coursModel.remove(parseInt(req.params.id));
  return res.status(200).json({ message: 'Cours supprimé' });
});

module.exports = { getAll, getMesCours, getOne, create, update, updateStatut, remove };
