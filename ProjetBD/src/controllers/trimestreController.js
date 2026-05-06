const asyncHandler = require('../utils/asyncHandler');
const trimestreModel = require('../models/trimestreModel');

const getAll = asyncHandler(async (req, res) => {
  const trimestres = await trimestreModel.findAll(req.query);
  return res.status(200).json({ total: trimestres.length, data: trimestres });
});

const getOne = asyncHandler(async (req, res) => {
  const trimestre = await trimestreModel.findById(parseInt(req.params.id));
  if (!trimestre) return res.status(404).json({ message: 'Trimestre introuvable' });
  return res.status(200).json({ data: trimestre });
});

const create = asyncHandler(async (req, res) => {
  const data = { ...req.body, idAdmin: req.user.id };
  const idTrimes = await trimestreModel.create(data);
  const trimestre = await trimestreModel.findById(idTrimes);
  return res.status(201).json({ message: 'Trimestre créé', data: trimestre });
});

const update = asyncHandler(async (req, res) => {
  const idTrimes = parseInt(req.params.id);
  await trimestreModel.update(idTrimes, req.body);
  const trimestre = await trimestreModel.findById(idTrimes);
  return res.status(200).json({ message: 'Trimestre modifié', data: trimestre });
});

const remove = asyncHandler(async (req, res) => {
  await trimestreModel.remove(parseInt(req.params.id));
  return res.status(200).json({ message: 'Trimestre supprimé' });
});

module.exports = { getAll, getOne, create, update, remove };
