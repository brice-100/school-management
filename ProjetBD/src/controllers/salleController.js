// src/controllers/salleController.js
const asyncHandler = require('../utils/asyncHandler');
const salleModel = require('../models/salleModel');

const getAll = asyncHandler(async (req, res) => {
  const salles = await salleModel.findAll();
  return res.status(200).json({ total: salles.length, data: salles });
});

const getOne = asyncHandler(async (req, res) => {
  const salle = await salleModel.findById(parseInt(req.params.id));
  if (!salle) return res.status(404).json({ message: 'Salle introuvable' });
  return res.status(200).json({ data: salle });
});

const create = asyncHandler(async (req, res) => {
  const data = { ...req.body, idAdmin: req.user.id };
  const idSalle = await salleModel.create(data);
  const salle = await salleModel.findById(idSalle);
  return res.status(201).json({ message: 'Salle créée', data: salle });
});

const update = asyncHandler(async (req, res) => {
  const idSalle = parseInt(req.params.id);
  await salleModel.update(idSalle, req.body);
  const salle = await salleModel.findById(idSalle);
  return res.status(200).json({ message: 'Salle modifiée', data: salle });
});

const remove = asyncHandler(async (req, res) => {
  await salleModel.remove(parseInt(req.params.id));
  return res.status(200).json({ message: 'Salle supprimée' });
});

module.exports = { getAll, getOne, create, update, remove };
