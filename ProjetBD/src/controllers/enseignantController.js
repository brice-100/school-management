const bcrypt            = require('bcryptjs');
const asyncHandler      = require('../utils/asyncHandler');
const enseignantModel   = require('../models/enseignantModel');

/** Normalise idCours depuis body (string, tableau, ou JSON). */
const parseIdCoursBody = (raw) => {
  if (raw === undefined) return undefined;
  if (Array.isArray(raw)) return raw.map(Number).filter(Boolean);
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        return Array.isArray(parsed) ? parsed.map(Number).filter(Boolean) : [parseInt(trimmed, 10)].filter(Boolean);
      } catch {
        return [parseInt(trimmed, 10)].filter(Boolean);
      }
    }
    return [parseInt(trimmed, 10)].filter(Boolean);
  }
  return [parseInt(raw, 10)].filter(Boolean);
};

/**
 * GET /api/enseignants
 * Liste tous les enseignants avec leurs cours (multi-matières)
 */
const getAll = asyncHandler(async (req, res) => {
  const filters = {};
  if (req.query.actif !== undefined) filters.actif = parseInt(req.query.actif);
  if (req.query.search) filters.search = req.query.search;
  if (req.query.archives === '1') filters.isDeleted = 1;
  else filters.isDeleted = 0;

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
 *           username, password, alanyaID, idCours (string | array), classe_id }
 */
const create = asyncHandler(async (req, res) => {
  const { nom, prenom, mobile, phone, username, alanyaID, classe_id } = req.body;

  const idCoursArr = parseIdCoursBody(req.body.idCours) || [];

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
    photo: req.file ? `/uploads/photos/${req.file.filename}` : null
  };

  const enseignantData = {
    idCours: idCoursArr,
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
      const [r] = await pool.query(
        'INSERT INTO Salle (libelle, surface, idClasse, actif, idAdmin, created_at) VALUES (?, ?, ?, 1, ?, NOW())',
        ['Salle Unique', 'NON DEFINIE', classe_id, req.user.id]
      );
      idSalle = r.insertId;
    }
    await pool.query(
      'INSERT INTO Titulaire (idPers, idSalle, actif, idAdmin, created_at) VALUES (?, ?, 1, ?, NOW())',
      [idPers, idSalle, req.user.id]
    );
  }

  const enseignant = await enseignantModel.findById(idEnseignant);
  return res.status(201).json({ message: 'Enseignant créé avec succès', data: enseignant });
});

/**
 * PUT /api/enseignants/:idEnseignant
 * Modifier les infos personnelles d'un enseignant
 * Body : { nom, prenom, dateNaissance, lieuNaissance, mobile, phone, alanyaID,
 *           idCours (string | array), classe_id }
 */
const update = asyncHandler(async (req, res) => {
  const idEnseignant = parseInt(req.params.idEnseignant);

  const existing = await enseignantModel.findById(idEnseignant);
  if (!existing) {
    return res.status(404).json({ message: 'Enseignant introuvable' });
  }

  // Mettre à jour les infos Personne
  await enseignantModel.updatePersonne(existing.idPers, req.body);

  // Analyser les matières envoyées AVANT de créer éventuellement l'entrée Enseignant
  const coursIds = parseIdCoursBody(req.body.idCours);
  const firstCoursId = (coursIds && coursIds.length > 0) ? coursIds[0] : null;

  let currentIdEnseignant = existing.idEnseignant;
  if (!currentIdEnseignant) {
    const pool = require('../config/db');
    const [ensRes] = await pool.query(
      'INSERT INTO Enseignant (idPers, idCours, Actif, idAdmin, created_at) VALUES (?, ?, 1, ?, NOW())',
      [existing.idPers, firstCoursId, req.user.id]
    );
    currentIdEnseignant = ensRes.insertId;
  }

  // Mettre à jour les matières si fournies (multi-matières)
  if (coursIds !== undefined && currentIdEnseignant) {
    await enseignantModel.setMatieres(currentIdEnseignant, existing.idPers, coursIds, req.user.id);
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
        const [r] = await pool.query(
          'INSERT INTO Salle (libelle, surface, idClasse, actif, idAdmin, created_at) VALUES (?, ?, ?, 1, ?, NOW())',
          ['Salle Unique', 'NON DEFINIE', req.body.classe_id, req.user.id]
        );
        idSalle = r.insertId;
      }
      await pool.query(
        'INSERT INTO Titulaire (idPers, idSalle, actif, idAdmin, created_at) VALUES (?, ?, 1, ?, NOW())',
        [existing.idPers, idSalle, req.user.id]
      );
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

  await enseignantModel.setActif(existing.idEnseignant, existing.idPers, actif);
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
 * Suppression logique — réservé root/admin
 */
const remove = asyncHandler(async (req, res) => {
  const idEnseignant = parseInt(req.params.idEnseignant);

  const existing = await enseignantModel.findById(idEnseignant);
  if (!existing) {
    return res.status(404).json({ message: 'Enseignant introuvable' });
  }

  await enseignantModel.remove(existing.idEnseignant, existing.idPers);
  return res.status(200).json({ message: 'Enseignant supprimé logiquement', idEnseignant });
});

/**
 * PATCH /api/enseignants/:idEnseignant/restaurer
 * Restaure un enseignant archivé
 */
const restore = asyncHandler(async (req, res) => {
  const idPers = parseInt(req.params.idEnseignant);
  const pool = require('../config/db');
  
  const [pers] = await pool.query('SELECT idPers FROM Personne WHERE idPers = ? AND typePersonne = 1', [idPers]);
  if (!pers[0]) return res.status(404).json({ message: 'Enseignant introuvable' });

  await enseignantModel.restore(idPers);
  return res.status(200).json({ message: 'Enseignant restauré avec succès', idEnseignant: idPers });
});

/**
 * GET /api/enseignants/:idEnseignant/eleves
 * Retourne la liste des élèves des classes où l'enseignant enseigne
 */
const getElevesEnseignant = asyncHandler(async (req, res) => {
  const idEnseignant = parseInt(req.params.idEnseignant);
  const pool = require('../config/db');

  const enseignant = await enseignantModel.findById(idEnseignant);
  if (!enseignant) {
    return res.status(404).json({ message: 'Enseignant introuvable' });
  }

  const currentAnnee = parseInt(req.idAnnee) || null;

  // 1. Vérifier si l'enseignant est affecté comme Titulaire à une ou plusieurs salles
  const [titulaireRows] = await pool.query('SELECT idSalle FROM Titulaire WHERE idPers = ? AND actif = 1', [enseignant.idPers]);
  const isTitulaire = titulaireRows.length > 0;

  let query = '';
  let queryParams = [];

  if (isTitulaire) {
    // S'il est affecté à une classe (Titulaire), il ne voit QUE les élèves de cette classe
    const sallesIds = titulaireRows.map(r => r.idSalle);
    query = `
      SELECT DISTINCT
        e.matricule, e.nom, e.prenom, e.sexe,
        e.photoURL AS photo, e.actif,
        s.idSalle, cl.idClasse,
        cl.libelle AS cl_libelle,
        s.libelle AS s_libelle,
        CONCAT(cl.libelle, ' - ', s.libelle) AS classe_nom,
        e.dateNaissance
      FROM Eleve e
      JOIN Frequente f ON f.matricule = e.matricule
      JOIN Salle s ON s.idSalle = f.idSalle
      JOIN Classe cl ON cl.idClasse = s.idClasse
      WHERE s.idSalle IN (?)
      AND e.actif = 1 AND e.isDeleted = 0
      AND (f.idAcademi = ? OR ? IS NULL)
      ORDER BY cl_libelle ASC, s_libelle ASC, e.nom ASC, e.prenom ASC
    `;
    queryParams = [sallesIds, currentAnnee, currentAnnee];
  } else {
    // Sinon (professeur de spécialité), il voit les élèves des classes où il a des matières
    query = `
      SELECT DISTINCT
        e.matricule, e.nom, e.prenom, e.sexe,
        e.photoURL AS photo, e.actif,
        s.idSalle, cl.idClasse,
        cl.libelle AS cl_libelle,
        s.libelle AS s_libelle,
        CONCAT(cl.libelle, ' - ', s.libelle) AS classe_nom,
        e.dateNaissance
      FROM Eleve e
      JOIN Frequente f ON f.matricule = e.matricule
      JOIN Salle s ON s.idSalle = f.idSalle
      JOIN Classe cl ON cl.idClasse = s.idClasse
      WHERE (
        s.idClasse IN (
          SELECT c.idClasse FROM Cours c
          JOIN Enseignant ens ON ens.idCours = c.idCours
          WHERE ens.idPers = ?
        )
        OR s.idClasse IN (
          SELECT c2.idClasse FROM teacher_matieres tm
          JOIN Cours c2 ON c2.idCours = tm.matiere_id
          JOIN Enseignant ens2 ON ens2.idEnseignant = tm.teacher_id
          WHERE ens2.idPers = ?
        )
      )
      AND e.actif = 1 AND e.isDeleted = 0
      AND (f.idAcademi = ? OR ? IS NULL)
      ORDER BY cl_libelle ASC, s_libelle ASC, e.nom ASC, e.prenom ASC
    `;
    queryParams = [enseignant.idPers, enseignant.idPers, currentAnnee, currentAnnee];
  }

  const [rows] = await pool.query(query, queryParams);

  // Grouper par salle
  const classeMap = {};
  for (const row of rows) {
    if (!classeMap[row.idSalle]) {
      classeMap[row.idSalle] = {
        idClasse: row.idClasse,
        idSalle: row.idSalle,
        classe_nom: row.classe_nom,
        eleves: []
      };
    }
    classeMap[row.idSalle].eleves.push({
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
  return res.status(200).json({ total: rows.length, classes, data: rows });
});

/**
 * DELETE /api/enseignants/:idEnseignant/hard
 * Suppression définitive — réservé root/admin
 */
const hardRemove = asyncHandler(async (req, res) => {
  const idEnseignant = parseInt(req.params.idEnseignant);

  const pool = require('../config/db');
  const [ens] = await pool.query('SELECT idEnseignant FROM Enseignant WHERE idPers = ?', [idEnseignant]);
  if (!ens[0] && !idEnseignant) return res.status(404).json({ message: 'Enseignant introuvable' });

  await enseignantModel.hardRemove(ens[0]?.idEnseignant || null, idEnseignant);
  return res.status(200).json({ message: 'Enseignant supprimé définitivement', idEnseignant });
});

module.exports = { getAll, getOne, create, update, updateStatut, updatePassword, remove, restore, getElevesEnseignant, hardRemove };
