const asyncHandler = require('../utils/asyncHandler');
const scolariteModel = require('../models/scolariteModel');

const getAll = asyncHandler(async (req, res) => {
  const scolarites = await scolariteModel.findAll();
  return res.status(200).json({ total: scolarites.length, data: scolarites });
});

const getOne = asyncHandler(async (req, res) => {
  const scolarite = await scolariteModel.findById(parseInt(req.params.id));
  if (!scolarite) return res.status(404).json({ message: 'Scolarité introuvable' });
  return res.status(200).json({ data: scolarite });
});

const create = asyncHandler(async (req, res) => {
  const data = { ...req.body, idFondateur: req.user.id };
  const idScolarite = await scolariteModel.create(data);
  const scolarite = await scolariteModel.findById(idScolarite);
  return res.status(201).json({ message: 'Scolarité créée', data: scolarite });
});

const update = asyncHandler(async (req, res) => {
  const idScolarite = parseInt(req.params.id);
  await scolariteModel.update(idScolarite, req.body);
  const scolarite = await scolariteModel.findById(idScolarite);
  return res.status(200).json({ message: 'Scolarité modifiée', data: scolarite });
});

const remove = asyncHandler(async (req, res) => {
  await scolariteModel.remove(parseInt(req.params.id));
  return res.status(200).json({ message: 'Scolarité supprimée' });
});

module.exports = { getAll, getOne, create, update, remove };
