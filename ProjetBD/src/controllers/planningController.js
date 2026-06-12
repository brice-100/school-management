const asyncHandler = require('../utils/asyncHandler');
const planningModel = require('../models/planningModel');
const pool = require('../config/db');

const getFormData = asyncHandler(async (req, res) => {
  const [classes] = await pool.query('SELECT idClasse as id, libelle as nom FROM Classe');
  const [courses] = await pool.query('SELECT idCours as id, libelle as nom FROM Cours WHERE actif = 1');
  const [salles]  = await pool.query('SELECT idSalle as id, libelle as nom FROM Salle');
  const [teachers] = await pool.query(`
    SELECT e.idEnseignant as id, p.prenom, p.nom 
    FROM Personne p
    JOIN Enseignant e ON p.idPers = e.idPers
    WHERE p.typePersonne = 1 AND e.Actif = 1
  `);
  
  return res.status(200).json({ 
    data: { classes, matieres: courses, teachers, salles } 
  });
});

const getByClasse = asyncHandler(async (req, res) => {
  const idClasse = parseInt(req.params.id || req.query.idClasse || req.query.id);
  const idAnnee = req.query.idAnnee;
  const isDeleted = req.query.archives === '1' ? 1 : 0;
  const plannings = await planningModel.findAll({ idClasse, idAnnee, isDeleted });
  return res.status(200).json({ data: plannings });
});

const getByTeacher = asyncHandler(async (req, res) => {
  const idPers = parseInt(req.params.id || req.query.idTeacher || req.query.idPers || req.query.id);
  const idAnnee = req.query.idAnnee;
  const isDeleted = req.query.archives === '1' ? 1 : 0;
  const plannings = await planningModel.findAll({ idPers, idAnnee, isDeleted }); 
  return res.status(200).json({ data: plannings });
});

const getMine = asyncHandler(async (req, res) => {
  const idAnnee = req.query.idAnnee;
  const isDeleted = req.query.archives === '1' ? 1 : 0;
  const plannings = await planningModel.findAll({ idPers: req.user.id, idAnnee, isDeleted }); 
  return res.status(200).json({ data: plannings });
});

const getAll = asyncHandler(async (req, res) => {
  const filters = { ...req.query };
  if (req.query.archives === '1') filters.isDeleted = 1;
  else filters.isDeleted = 0;
  const plannings = await planningModel.findAll(filters);
  return res.status(200).json({ data: plannings });
});

const create = asyncHandler(async (req, res) => {
  const { jour, heure_debut, heure_fin, classe_id, matiere_id, teacher_id, salle_id } = req.body;
  
  let idAnnee = req.body.idAnnee;
  if (!idAnnee) {
    const [annees] = await pool.query('SELECT idAnnee FROM AnneeAcademique WHERE est_active = 1 LIMIT 1');
    idAnnee = annees.length > 0 ? annees[0].idAnnee : 1;
  }

  const data = {
    jour,
    heure_debut,
    heure_fin,
    idClasse: classe_id,
    idCours:  matiere_id,
    idEnseignant: teacher_id,
    idSalle: salle_id,
    idAdmin:  req.user.id,
    idAnnee
  };

  const idTemps = await planningModel.create(data);
  const planning = await planningModel.findById(idTemps);
  return res.status(201).json({ message: 'Créneau ajouté', data: planning });
});

const update = asyncHandler(async (req, res) => {
  const idTemps = parseInt(req.params.id);
  const { jour, heure_debut, heure_fin, classe_id, matiere_id, teacher_id, salle_id } = req.body;
  
  const data = {
    jour,
    heure_debut,
    heure_fin,
    idClasse: classe_id,
    idCours:  matiere_id,
    idEnseignant: teacher_id,
    idSalle: salle_id
  };

  await planningModel.update(idTemps, data);
  const planning = await planningModel.findById(idTemps);
  return res.status(200).json({ message: 'Créneau modifié', data: planning });
});

const remove = asyncHandler(async (req, res) => {
  await planningModel.remove(parseInt(req.params.id));
  return res.status(200).json({ message: 'Créneau supprimé logiquement' });
});

const restore = asyncHandler(async (req, res) => {
  await planningModel.restore(parseInt(req.params.id));
  return res.status(200).json({ message: 'Créneau restauré avec succès' });
});

const getJoursSemaine = asyncHandler(async (req, res) => {
  return res.status(200).json({ data: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'] });
});

module.exports = { getFormData, getByClasse, getByTeacher, getMine, getAll, create, update, remove, restore, getJoursSemaine };
