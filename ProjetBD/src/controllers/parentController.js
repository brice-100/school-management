// src/controllers/parentController.js
const bcrypt = require('bcryptjs');
const asyncHandler = require('../utils/asyncHandler');
const parentModel = require('../models/parentModel');

const getAll = asyncHandler(async (req, res) => {
  const filters = {};
  if (req.query.actif !== undefined) filters.actif = parseInt(req.query.actif);
  if (req.query.archives === '1') filters.isDeleted = 1;
  else filters.isDeleted = 0;
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
  
  await parentModel.remove(existing.idPers);
  return res.status(200).json({ message: 'Parent supprimé logiquement' });
});

const restore = asyncHandler(async (req, res) => {
  const idParent = parseInt(req.params.id);
  // We need idPers
  const pool = require('../config/db');
  const [pa] = await pool.query('SELECT idPers FROM Parents WHERE idParent = ?', [idParent]);
  if (!pa[0]) return res.status(404).json({ message: 'Parent introuvable' });

  await parentModel.restore(pa[0].idPers);
  return res.status(200).json({ message: 'Parent restauré avec succès' });
});

const removeHard = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  
  // 1. Trouver l'idPers (même si le parent est archivé)
  const pool = require('../config/db');
  const [rows] = await pool.query(`
    SELECT p.idPers 
    FROM Personne p
    LEFT JOIN Parents pa ON p.idPers = pa.idPers
    WHERE pa.idParent = ? OR p.idPers = ?
    LIMIT 1
  `, [id, id]);
  
  if (rows.length === 0) {
    return res.status(404).json({ message: 'Parent introuvable' });
  }
  
  const idPers = rows[0].idPers;
  await parentModel.removeHard(idPers);
  return res.status(200).json({ message: 'Parent supprimé définitivement' });
});

const getMesEnfants = asyncHandler(async (req, res) => {
  const enfants = await parentModel.findChildrenByParentIdPers(req.user.id);
  return res.status(200).json({ total: enfants.length, data: enfants });
});

module.exports = { getAll, getOne, getMesEnfants, create, update, updateStatut, remove, restore, removeHard };
