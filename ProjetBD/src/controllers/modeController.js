const asyncHandler = require('../utils/asyncHandler');
const modeModel = require('../models/modeModel');

const getAll = asyncHandler(async (req, res) => {
  const modes = await modeModel.findAll();
  return res.status(200).json({ total: modes.length, data: modes });
});

const create = asyncHandler(async (req, res) => {
  const data = { ...req.body, idFondateur: req.user.id };
  const idMode = await modeModel.create(data);
  const mode = await modeModel.findById(idMode);
  return res.status(201).json({ message: 'Mode de paiement créé', data: mode });
});

const update = asyncHandler(async (req, res) => {
  const idMode = parseInt(req.params.id);
  await modeModel.update(idMode, req.body);
  const mode = await modeModel.findById(idMode);
  return res.status(200).json({ message: 'Mode modifié', data: mode });
});

module.exports = { getAll, create, update };
