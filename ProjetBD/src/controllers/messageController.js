const asyncHandler = require('../utils/asyncHandler');
const messageModel = require('../models/messageModel');

const getAll = asyncHandler(async (req, res) => {
  const filters = { ...req.query };
  if (req.query.archives === '1') filters.isDeleted = 1;
  else filters.isDeleted = 0;
  const messages = await messageModel.findAll(filters);
  return res.status(200).json({ total: messages.length, data: messages });
});

const getOne = asyncHandler(async (req, res) => {
  const message = await messageModel.findById(parseInt(req.params.id));
  if (!message) return res.status(404).json({ message: 'Message introuvable' });
  return res.status(200).json({ data: message });
});

const create = asyncHandler(async (req, res) => {
  const data = { ...req.body, idExp_Pers: req.user.id };
  const idMessages = await messageModel.create(data);
  const message = await messageModel.findById(idMessages);
  return res.status(201).json({ message: 'Message créé', data: message });
});

const update = asyncHandler(async (req, res) => {
  const idMessages = parseInt(req.params.id);
  await messageModel.update(idMessages, req.body);
  const message = await messageModel.findById(idMessages);
  return res.status(200).json({ message: 'Message modifié', data: message });
});

const remove = asyncHandler(async (req, res) => {
  await messageModel.remove(parseInt(req.params.id));
  return res.status(200).json({ message: 'Message supprimé logiquement' });
});

const restore = asyncHandler(async (req, res) => {
  await messageModel.restore(parseInt(req.params.id));
  return res.status(200).json({ message: 'Message restauré avec succès' });
});

module.exports = { getAll, getOne, create, update, remove, restore };
