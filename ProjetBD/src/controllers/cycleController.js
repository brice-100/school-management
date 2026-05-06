// src/controllers/cycleController.js
const asyncHandler = require('../utils/asyncHandler');
const cycleModel = require('../models/cycleModel');

const getAll = asyncHandler(async (req, res) => {
  const cycles = await cycleModel.findAll();
  return res.status(200).json({ total: cycles.length, data: cycles });
});

const getOne = asyncHandler(async (req, res) => {
  const cycle = await cycleModel.findById(parseInt(req.params.id));
  if (!cycle) return res.status(404).json({ message: 'Cycle introuvable' });
  return res.status(200).json({ data: cycle });
});

const create = asyncHandler(async (req, res) => {
  const data = { ...req.body, idAdmin: req.user.id };
  const idCycle = await cycleModel.create(data);
  const cycle = await cycleModel.findById(idCycle);
  return res.status(201).json({ message: 'Cycle créé', data: cycle });
});

const update = asyncHandler(async (req, res) => {
  const idCycle = parseInt(req.params.id);
  await cycleModel.update(idCycle, req.body);
  const cycle = await cycleModel.findById(idCycle);
  return res.status(200).json({ message: 'Cycle modifié', data: cycle });
});

const remove = asyncHandler(async (req, res) => {
  await cycleModel.remove(parseInt(req.params.id));
  return res.status(200).json({ message: 'Cycle supprimé' });
});

module.exports = { getAll, getOne, create, update, remove };
