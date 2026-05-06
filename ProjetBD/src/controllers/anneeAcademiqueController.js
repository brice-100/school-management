const asyncHandler = require('../utils/asyncHandler');
const anneeAcademiqueModel = require('../models/anneeAcademiqueModel');

const getAll = asyncHandler(async (req, res) => {
  const annees = await anneeAcademiqueModel.findAll();
  return res.status(200).json({ total: annees.length, data: annees });
});

const getActive = asyncHandler(async (req, res) => {
  const annee = await anneeAcademiqueModel.getActive();
  return res.status(200).json({ data: annee || null });
});

const getOne = asyncHandler(async (req, res) => {
  const annee = await anneeAcademiqueModel.findById(parseInt(req.params.id));
  if (!annee) return res.status(404).json({ message: 'Année académique introuvable' });
  return res.status(200).json({ data: annee });
});

const create = asyncHandler(async (req, res) => {
  const data = { ...req.body, idAdmin: req.user.id };
  const idAnnee = await anneeAcademiqueModel.create(data);
  const annee = await anneeAcademiqueModel.findById(idAnnee);
  return res.status(201).json({ message: 'Année académique créée', data: annee });
});

const update = asyncHandler(async (req, res) => {
  const idAnnee = parseInt(req.params.id);
  await anneeAcademiqueModel.update(idAnnee, req.body);
  const annee = await anneeAcademiqueModel.findById(idAnnee);
  return res.status(200).json({ message: 'Année académique modifiée', data: annee });
});

const remove = asyncHandler(async (req, res) => {
  await anneeAcademiqueModel.remove(parseInt(req.params.id));
  return res.status(200).json({ message: 'Année académique supprimée' });
});

const setActive = asyncHandler(async (req, res) => {
  const idAnnee = parseInt(req.params.id);
  const result = await anneeAcademiqueModel.setActive(idAnnee);
  if (!result) return res.status(404).json({ message: 'Année académique introuvable' });
  const annee = await anneeAcademiqueModel.findById(idAnnee);
  return res.status(200).json({ message: 'Année académique définie comme active', data: annee });
});

module.exports = { getAll, getActive, getOne, setActive, create, update, remove };
