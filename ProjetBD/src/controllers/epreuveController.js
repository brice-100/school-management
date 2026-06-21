const asyncHandler = require('../utils/asyncHandler');
const epreuveModel = require('../models/epreuveModel');
const path = require('path');
const fs = require('fs');

const getAll = asyncHandler(async (req, res) => {
  const epreuves = await epreuveModel.findAll(req.query);
  return res.status(200).json({ total: epreuves.length, data: epreuves });
});

const getClasse = asyncHandler(async (req, res) => {
  const epreuves = await epreuveModel.findAll(req.query);
  return res.status(200).json({ total: epreuves.length, data: epreuves });
});

const getOne = asyncHandler(async (req, res) => {
  const epreuve = await epreuveModel.findById(parseInt(req.params.id));
  if (!epreuve) return res.status(404).json({ message: 'Épreuve introuvable' });
  return res.status(200).json({ data: epreuve });
});

/**
 * POST /api/epreuves
 * Crée une épreuve avec fichier uploadé (optionnel)
 */
const create = asyncHandler(async (req, res) => {
  const data = { ...req.body, idPers: req.user.id };

  // Si un fichier a été uploadé via multer
  if (req.file) {
    data.urlDoc = `/uploads/epreuves/${req.file.filename}`;
  }

  const idEpreuve = await epreuveModel.create(data);
  const epreuve = await epreuveModel.findById(idEpreuve);
  return res.status(201).json({ message: 'Épreuve créée', data: epreuve });
});

/**
 * PUT /api/epreuves/:id
 * Modifie une épreuve, remplace le fichier si un nouveau est uploadé
 */
const update = asyncHandler(async (req, res) => {
  const idEpreuve = parseInt(req.params.id);
  const existing = await epreuveModel.findById(idEpreuve);
  if (!existing) return res.status(404).json({ message: 'Épreuve introuvable' });

  const data = { ...req.body };

  if (req.file) {
    // Supprimer l'ancien fichier s'il existe
    if (existing.urlDoc && existing.urlDoc !== 'INDEFINI' && !existing.urlDoc.startsWith('http')) {
      const oldPath = path.join(__dirname, '..', '..', existing.urlDoc);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    data.urlDoc = `/uploads/epreuves/${req.file.filename}`;
  } else {
    data.urlDoc = existing.urlDoc;
  }

  await epreuveModel.update(idEpreuve, data);
  const epreuve = await epreuveModel.findById(idEpreuve);
  return res.status(200).json({ message: 'Épreuve modifiée', data: epreuve });
});

const remove = asyncHandler(async (req, res) => {
  const idEpreuve = parseInt(req.params.id);
  const existing = await epreuveModel.findById(idEpreuve);
  if (existing && existing.urlDoc && existing.urlDoc !== 'INDEFINI' && !existing.urlDoc.startsWith('http')) {
    const filePath = path.join(__dirname, '..', '..', existing.urlDoc);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
  await epreuveModel.remove(idEpreuve);
  return res.status(200).json({ message: 'Épreuve supprimée' });
});

module.exports = { getAll, getClasse, getOne, create, update, remove };
