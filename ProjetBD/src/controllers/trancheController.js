const asyncHandler = require('../utils/asyncHandler');
const trancheModel = require('../models/trancheModel');

const getAll = asyncHandler(async (req, res) => {
  const tranches = await trancheModel.findAll(req.query);
  return res.status(200).json({ total: tranches.length, data: tranches });
});

const getOne = asyncHandler(async (req, res) => {
  const tranche = await trancheModel.findById(parseInt(req.params.id));
  if (!tranche) return res.status(404).json({ message: 'Tranche introuvable' });
  return res.status(200).json({ data: tranche });
});

const create = asyncHandler(async (req, res) => {
  const data = { ...req.body, idFondateur: req.user.id };
  const idTranche = await trancheModel.create(data);
  const tranche = await trancheModel.findById(idTranche);
  return res.status(201).json({ message: 'Tranche créée', data: tranche });
});

const update = asyncHandler(async (req, res) => {
  const idTranche = parseInt(req.params.id);
  await trancheModel.update(idTranche, req.body);
  const tranche = await trancheModel.findById(idTranche);
  return res.status(200).json({ message: 'Tranche modifiée', data: tranche });
});

const remove = asyncHandler(async (req, res) => {
  await trancheModel.remove(parseInt(req.params.id));
  return res.status(200).json({ message: 'Tranche supprimée' });
});

module.exports = { getAll, getOne, create, update, remove };
