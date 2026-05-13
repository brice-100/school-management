const bcrypt            = require('bcryptjs');
const asyncHandler      = require('../utils/asyncHandler');
const enseignantModel   = require('../models/enseignantModel');

/**
 * GET /api/enseignants
 * Liste tous les enseignants avec leur cours
 */
const getAll = asyncHandler(async (req, res) => {
  const filters = {};
  if (req.query.actif !== undefined) filters.actif = parseInt(req.query.actif);
  if (req.query.search) filters.search = req.query.search;

  const enseignants = await enseignantModel.findAll(filters);
  return res.status(200).json({ total: enseignants.length, data: enseignants });
});

/**
 * GET /api/enseignants/:idEnseignant
 * Détail d'un enseignant
 */
const getOne = asyncHandler(async (req, res) => {
  const enseignant = await enseignantModel.findById(parseInt(req.params.idEnseignant));
  if (!enseignant) {
    return res.status(404).json({ message: 'Enseignant introuvable' });
  }
  return res.status(200).json({ data: enseignant });
});

/**
 * POST /api/enseignants
 * Créer un enseignant (Personne + Enseignant en transaction)
 * Body : { nom, prenom, dateNaissance, lieuNaissance, mobile, phone,
 *           username, password, alanyaID, idCours }
 */
const create = asyncHandler(async (req, res) => {
  const {
    nom, prenom, mobile, phone, username, alanyaID, idCours, classe_id
  } = req.body;

  // Mapper le mot de passe (le frontend envoie mot_de_passe)
  const password = req.body.password || req.body.mot_de_passe;
  if (!password) {
    return res.status(400).json({ message: 'Le mot de passe est obligatoire' });
  }

  // Valeurs par défaut pour les champs obligatoires en DB si absents
  const dateNaissance = req.body.dateNaissance || '1970-01-01';
  const lieuNaissance = req.body.lieuNaissance || 'INDEFINI';

  // Vérifier que le username n'est pas déjà pris
  const taken = await enseignantModel.isUsernameTaken(username);
  if (taken) {
    return res.status(409).json({ message: 'Ce nom d\'utilisateur est déjà utilisé' });
  }

  // Hasher le mot de passe
  const hashedPassword = await bcrypt.hash(password, 10);

  const personneData = {
    nom, prenom, dateNaissance, lieuNaissance,
    mobile: mobile || '000', 
    phone: phone || mobile || '000', 
    username,
    password: hashedPassword,
    alanyaID: alanyaID || null,
    idAdmin: req.user.id,
    // Gérer la photo si uploadée
    photo: req.file ? `/uploads/photos/${req.file.filename}` : null
  };

  const enseignantData = {
    idCours: parseInt(idCours) || null,
    idAdmin: req.user.id,
  };

  const { idPers, idEnseignant } = await enseignantModel.create(personneData, enseignantData);

  // Gérer l'affectation à une classe (Titulaire)
  if (classe_id) {
    const pool = require('../config/db');
    const [salles] = await pool.query('SELECT idSalle FROM Salle WHERE idClasse = ? LIMIT 1', [classe_id]);
    let idSalle;
    if (salles.length > 0) {
      idSalle = salles[0].idSalle;
    } else {
      const [res] = await pool.query('INSERT INTO Salle (libelle, surface, idClasse, actif, idAdmin, created_at) VALUES (?, ?, ?, 1, ?, NOW())', ['Salle Unique', 'NON DEFINIE', classe_id, req.user.id]);
      idSalle = res.insertId;
    }
    await pool.query('INSERT INTO Titulaire (idPers, idSalle, actif, idAdmin, created_at) VALUES (?, ?, 1, ?, NOW())', [idPers, idSalle, req.user.id]);
  }

  const enseignant = await enseignantModel.findById(idEnseignant);

  return res.status(201).json({ message: 'Enseignant créé avec succès', data: enseignant });
});

/**
 * PUT /api/enseignants/:idEnseignant
 * Modifier les infos personnelles d'un enseignant
 * Body : { nom, prenom, dateNaissance, lieuNaissance, mobile, phone, alanyaID, idCours }
 */
const update = asyncHandler(async (req, res) => {
  const idEnseignant = parseInt(req.params.idEnseignant);

  const existing = await enseignantModel.findById(idEnseignant);
  if (!existing) {
    return res.status(404).json({ message: 'Enseignant introuvable' });
  }

  // Mettre à jour les infos Personne
  await enseignantModel.updatePersonne(existing.idPers, req.body);

  // Mettre à jour le cours si fourni
  if (req.body.idCours) {
    await enseignantModel.updateCours(idEnseignant, req.body.idCours);
  }

  // Mettre à jour la classe (Titulaire)
  if (req.body.classe_id !== undefined) {
    const pool = require('../config/db');
    await pool.query('DELETE FROM Titulaire WHERE idPers = ?', [existing.idPers]);
    if (req.body.classe_id) {
      const [salles] = await pool.query('SELECT idSalle FROM Salle WHERE idClasse = ? LIMIT 1', [req.body.classe_id]);
      let idSalle;
      if (salles.length > 0) {
        idSalle = salles[0].idSalle;
      } else {
        const [res] = await pool.query('INSERT INTO Salle (libelle, surface, idClasse, actif, idAdmin, created_at) VALUES (?, ?, ?, 1, ?, NOW())', ['Salle Unique', 'NON DEFINIE', req.body.classe_id, req.user.id]);
        idSalle = res.insertId;
      }
      await pool.query('INSERT INTO Titulaire (idPers, idSalle, actif, idAdmin, created_at) VALUES (?, ?, 1, ?, NOW())', [existing.idPers, idSalle, req.user.id]);
    }
  }

  const updated = await enseignantModel.findById(idEnseignant);
  return res.status(200).json({ message: 'Enseignant mis à jour', data: updated });
});

/**
 * PATCH /api/enseignants/:idEnseignant/statut
 * Activer ou désactiver un enseignant
 * Body : { actif: 0 | 1 }
 */
const updateStatut = asyncHandler(async (req, res) => {
  const idEnseignant = parseInt(req.params.idEnseignant);
  const actif        = parseInt(req.body.actif);

  const existing = await enseignantModel.findById(idEnseignant);
  if (!existing) {
    return res.status(404).json({ message: 'Enseignant introuvable' });
  }

  await enseignantModel.setActif(idEnseignant, actif);
  return res.status(200).json({
    message: actif === 1 ? 'Enseignant activé' : 'Enseignant désactivé',
    idEnseignant,
    actif,
  });
});


/**
 * PATCH /api/enseignants/:idEnseignant/password
 * Changer le mot de passe d'un enseignant
 * Body : { newPassword }
 */
const updatePassword = asyncHandler(async (req, res) => {
  const idEnseignant = parseInt(req.params.idEnseignant);

  const existing = await enseignantModel.findById(idEnseignant);
  if (!existing) {
    return res.status(404).json({ message: 'Enseignant introuvable' });
  }

  const hashedPassword = await bcrypt.hash(req.body.newPassword, 10);
  await enseignantModel.updatePersonne(existing.idPers, { password: hashedPassword });

  return res.status(200).json({ message: 'Mot de passe mis à jour avec succès' });
});

/**
 * DELETE /api/enseignants/:idEnseignant
 * Suppression définitive — réservé root/admin
 */
const remove = asyncHandler(async (req, res) => {
  const idEnseignant = parseInt(req.params.idEnseignant);

  const existing = await enseignantModel.findById(idEnseignant);
  if (!existing) {
    return res.status(404).json({ message: 'Enseignant introuvable' });
  }

  await enseignantModel.remove(idEnseignant, existing.idPers);
  return res.status(200).json({ message: 'Enseignant supprimé définitivement', idEnseignant });
});

/**
 * GET /api/enseignants/:idEnseignant/eleves
 * Retourne la liste des élèves des classes où l'enseignant enseigne
 */
const getElevesEnseignant = asyncHandler(async (req, res) => {
  const idEnseignant = parseInt(req.params.idEnseignant);
  const pool = require('../config/db');

  // Récupérer idPers de l'enseignant
  const enseignant = await enseignantModel.findById(idEnseignant);
  if (!enseignant) {
    return res.status(404).json({ message: 'Enseignant introuvable' });
  }

  // Trouver les classes associées :
  // 1. Via la table Titulaire (classe titulaire)
  // 2. Via Cours → idClasse (cours enseigné)
  const [rows] = await pool.query(`
    SELECT DISTINCT
      e.matricule,
      e.nom,
      e.prenom,
      e.sexe,
      e.photoURL AS photo,
      e.actif,
      cl.idClasse,
      cl.libelle AS classe_nom,
      e.dateNaissance
    FROM Eleve e
    JOIN Frequente f ON f.matricule = e.matricule
    JOIN Salle s ON s.idSalle = f.idSalle
    JOIN Classe cl ON cl.idClasse = s.idClasse
    WHERE cl.idClasse IN (
      -- Classes via le cours enseigné
      SELECT c.idClasse FROM Cours c
      JOIN Enseignant ens ON ens.idCours = c.idCours
      WHERE ens.idPers = ?
      UNION
      -- Classes via Titulaire
      SELECT sa.idClasse FROM Titulaire ti
      JOIN Salle sa ON sa.idSalle = ti.idSalle
      WHERE ti.idPers = ?
    )
    AND e.actif = 1
    ORDER BY cl.libelle ASC, e.nom ASC, e.prenom ASC
  `, [enseignant.idPers, enseignant.idPers]);


  // Grouper par classe
  const classeMap = {};
  for (const row of rows) {
    if (!classeMap[row.idClasse]) {
      classeMap[row.idClasse] = {
        idClasse: row.idClasse,
        classe_nom: row.classe_nom,
        eleves: []
      };
    }
    classeMap[row.idClasse].eleves.push({
      matricule: row.matricule,
      nom: row.nom,
      prenom: row.prenom,
      sexe: row.sexe,
      photo: row.photo,
      actif: row.actif,
      dateNaissance: row.dateNaissance,
    });
  }

  const classes = Object.values(classeMap);
  const total_eleves = rows.length;

  return res.status(200).json({ total: total_eleves, classes, data: rows });
});

module.exports = { getAll, getOne, create, update, updateStatut, updatePassword, remove, getElevesEnseignant };
