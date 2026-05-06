const asyncHandler = require('../utils/asyncHandler');
const livreModel = require('../models/livreModel');

const getAll = asyncHandler(async (req, res) => {
  const livres = await livreModel.findAll(req.query);
  return res.status(200).json({ total: livres.length, data: livres });
});

const getOne = asyncHandler(async (req, res) => {
  const livre = await livreModel.findById(parseInt(req.params.id));
  if (!livre) return res.status(404).json({ message: 'Livre introuvable' });
  return res.status(200).json({ data: livre });
});

const create = asyncHandler(async (req, res) => {
  const data = { ...req.body, idAdmin: req.user.id };
  const idLivre = await livreModel.create(data);
  const livre = await livreModel.findById(idLivre);
  return res.status(201).json({ message: 'Livre créé', data: livre });
});

const update = asyncHandler(async (req, res) => {
  const idLivre = parseInt(req.params.id);
  await livreModel.update(idLivre, req.body);
  const livre = await livreModel.findById(idLivre);
  return res.status(200).json({ message: 'Livre modifié', data: livre });
});

const remove = asyncHandler(async (req, res) => {
  await livreModel.remove(parseInt(req.params.id));
  return res.status(200).json({ message: 'Livre supprimé' });
});

module.exports = { getAll, getOne, create, update, remove };
