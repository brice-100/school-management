// src/controllers/parentController.js
const bcrypt = require('bcryptjs');
const asyncHandler = require('../utils/asyncHandler');
const parentModel = require('../models/parentModel');

const getAll = asyncHandler(async (req, res) => {
  const filters = {};
  if (req.query.actif !== undefined) filters.actif = parseInt(req.query.actif);
  const parents = await parentModel.findAll(filters);
  return res.status(200).json({ total: parents.length, data: parents });
});

const getOne = asyncHandler(async (req, res) => {
  const parent = await parentModel.findById(parseInt(req.params.id));
  if (!parent) return res.status(404).json({ message: 'Parent introuvable' });
  return res.status(200).json({ data: parent });
});

const create = asyncHandler(async (req, res) => {
  const { nom, prenom, mobile, username, password, matricule } = req.body;
  if (!matricule) return res.status(400).json({ message: 'Le matricule de l\'élève est requis' });
  const hashedPassword = await bcrypt.hash(password || 'Parent@1234', 10);
  
  const personneData = { nom, prenom, mobile, username, password: hashedPassword };
  if (req.file) personneData.photo = `/uploads/photos/${req.file.filename}`;

  const idParent = await parentModel.create(personneData, matricule, req.user.id);
  const parent = await parentModel.findById(idParent);
  return res.status(201).json({ message: 'Parent créé', data: parent });
});

const update = asyncHandler(async (req, res) => {
  const idParent = parseInt(req.params.id);
  const existing = await parentModel.findById(idParent);
  if (!existing) return res.status(404).json({ message: 'Parent introuvable' });
  
  const data = { ...req.body };
  if (data.password) {
    data.password = await bcrypt.hash(data.password, 10);
  }
  if (req.file) {
    data.photo = `/uploads/photos/${req.file.filename}`;
  }
  
  await parentModel.updatePersonne(existing.idPers, data);
  const parent = await parentModel.findById(idParent);
  return res.status(200).json({ message: 'Parent modifié', data: parent });
});

const updateStatut = asyncHandler(async (req, res) => {
  const idParent = parseInt(req.params.id);
  const actif = parseInt(req.body.actif);
  await parentModel.setActif(idParent, actif);
  return res.status(200).json({ message: 'Statut du parent modifié' });
});

const remove = asyncHandler(async (req, res) => {
  const idParent = parseInt(req.params.id);
  const existing = await parentModel.findById(idParent);
  if (!existing) return res.status(404).json({ message: 'Parent introuvable' });
  
  const pool = require('../config/db');
  // Supprimer d'abord de la table Parents (FK)
  await pool.query('DELETE FROM Parents WHERE idParent = ?', [idParent]);
  // Puis de Personne (optionnel, mais propre si le parent est supprimé définitivement)
  await pool.query('DELETE FROM Personne WHERE idPers = ?', [existing.idPers]);
  
  return res.status(200).json({ message: 'Parent supprimé définitivement' });
});

const getMesEnfants = asyncHandler(async (req, res) => {
  const enfants = await parentModel.findChildrenByParentIdPers(req.user.id);
  return res.status(200).json({ total: enfants.length, data: enfants });
});

module.exports = { getAll, getOne, getMesEnfants, create, update, updateStatut, remove };
