// src/controllers/classeController.js
const asyncHandler = require('../utils/asyncHandler');
const classeModel = require('../models/classeModel');

const getAll = asyncHandler(async (req, res) => {
  const classes = await classeModel.findAll();
  return res.status(200).json({ total: classes.length, data: classes });
});

const getOne = asyncHandler(async (req, res) => {
  const classe = await classeModel.findById(parseInt(req.params.id));
  if (!classe) return res.status(404).json({ message: 'Classe introuvable' });
  return res.status(200).json({ data: classe });
});

const create = asyncHandler(async (req, res) => {
  const data = { ...req.body, idAdmin: req.user.id };
  const idClasse = await classeModel.create(data);
  const classe = await classeModel.findById(idClasse);
  return res.status(201).json({ message: 'Classe créée', data: classe });
});

const update = asyncHandler(async (req, res) => {
  const idClasse = parseInt(req.params.id);
  const data = { ...req.body };
  await classeModel.update(idClasse, data);
  const classe = await classeModel.findById(idClasse);
  return res.status(200).json({ message: 'Classe modifiée', data: classe });
});

const remove = asyncHandler(async (req, res) => {
  await classeModel.remove(parseInt(req.params.id));
  return res.status(200).json({ message: 'Classe supprimée' });
});

module.exports = { getAll, getOne, create, update, remove };
