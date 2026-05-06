const asyncHandler = require('../utils/asyncHandler');

const getRapports = asyncHandler(async (req, res) => {
  return res.status(200).json({ data: [] });
});

const getRapportsCours = asyncHandler(async (req, res) => {
  return res.status(200).json({ data: [] });
});

const createRapport = asyncHandler(async (req, res) => {
  return res.status(201).json({ message: 'Rapport créé', data: {} });
});

const updateRapport = asyncHandler(async (req, res) => {
  return res.status(200).json({ message: 'Rapport modifié', data: {} });
});

const getJustificatifs = asyncHandler(async (req, res) => {
  return res.status(200).json({ data: [] });
});

const createJustificatif = asyncHandler(async (req, res) => {
  return res.status(201).json({ message: 'Justificatif créé', data: {} });
});

const getDisciplines = asyncHandler(async (req, res) => {
  return res.status(200).json({ data: [] });
});

module.exports = { getRapports, getRapportsCours, createRapport, updateRapport, getJustificatifs, createJustificatif, getDisciplines };
