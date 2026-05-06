const asyncHandler = require('../utils/asyncHandler');
const sessionModel = require('../models/sessionModel');

const getAll = asyncHandler(async (req, res) => {
  const sessions = await sessionModel.findAll(req.query);
  return res.status(200).json({ total: sessions.length, data: sessions });
});

const getActives = asyncHandler(async (req, res) => {
  const sessions = await sessionModel.findAll();
  return res.status(200).json({ total: sessions.length, data: sessions });
});

const getOne = asyncHandler(async (req, res) => {
  const session = await sessionModel.findById(parseInt(req.params.id));
  if (!session) return res.status(404).json({ message: 'Session introuvable' });
  return res.status(200).json({ data: session });
});

const create = asyncHandler(async (req, res) => {
  const data = { ...req.body, idPers: req.user.id };
  const idSession = await sessionModel.create(data);
  const session = await sessionModel.findById(idSession);
  return res.status(201).json({ message: 'Session créée', data: session });
});

const update = asyncHandler(async (req, res) => {
  const idSession = parseInt(req.params.id);
  await sessionModel.update(idSession, req.body);
  const session = await sessionModel.findById(idSession);
  return res.status(200).json({ message: 'Session modifiée', data: session });
});

const remove = asyncHandler(async (req, res) => {
  await sessionModel.remove(parseInt(req.params.id));
  return res.status(200).json({ message: 'Session supprimée' });
});

module.exports = { getAll, getActives, getOne, create, update, remove };
