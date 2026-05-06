const asyncHandler = require('../utils/asyncHandler');
const evaluationModel = require('../models/evaluationModel');

const getAll = asyncHandler(async (req, res) => {
  const evaluations = await evaluationModel.findAll(req.query);
  return res.status(200).json({ total: evaluations.length, data: evaluations });
});

const getClasse = asyncHandler(async (req, res) => {
  const evaluations = await evaluationModel.findAll(req.query);
  return res.status(200).json({ total: evaluations.length, data: evaluations });
});

const getOne = asyncHandler(async (req, res) => {
  const evalId = parseInt(req.params.id);
  const evaluation = await evaluationModel.findById(evalId);
  if (!evaluation) return res.status(404).json({ message: 'Évaluation introuvable' });
  return res.status(200).json({ data: evaluation });
});

const create = asyncHandler(async (req, res) => {
  const data = { ...req.body, idPers: req.user.id };
  const idEval = await evaluationModel.create(data);
  const evaluation = await evaluationModel.findById(idEval);
  return res.status(201).json({ message: 'Évaluation créée', data: evaluation });
});

const update = asyncHandler(async (req, res) => {
  const evalId = parseInt(req.params.id);
  await evaluationModel.update(evalId, req.body);
  const evaluation = await evaluationModel.findById(evalId);
  return res.status(200).json({ message: 'Évaluation modifiée', data: evaluation });
});

const remove = asyncHandler(async (req, res) => {
  await evaluationModel.remove(parseInt(req.params.id));
  return res.status(200).json({ message: 'Évaluation supprimée' });
});

module.exports = { getAll, getClasse, getOne, create, update, remove };
