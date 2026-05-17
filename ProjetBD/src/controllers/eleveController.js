const asyncHandler = require('../utils/asyncHandler');
const eleveModel   = require('../models/eleveModel');
const path         = require('path');
const fs           = require('fs');

/**
 * GET /api/eleves
 * Liste tous les élèves. Filtres optionnels : ?actif=1 , ?idAdmin=2
 */
const getAll = asyncHandler(async (req, res) => {
  const filters = {};
  if (req.query.actif  !== undefined) filters.actif  = parseInt(req.query.actif);
  if (req.query.idAdmin !== undefined) filters.idAdmin = parseInt(req.query.idAdmin);
  if (req.query.idAnnee !== undefined) filters.idAnnee = parseInt(req.query.idAnnee);
  if (req.query.classe_id !== undefined) filters.classe_id = parseInt(req.query.classe_id);
  if (req.query.archives === '1') filters.isDeleted = 1;
  else filters.isDeleted = 0;

  const eleves = await eleveModel.findAll(filters);
  return res.status(200).json({ total: eleves.length, data: eleves });
});

/**
 * GET /api/eleves/:matricule
 * Détail d'un élève
 */
const getOne = asyncHandler(async (req, res) => {
  const idAnnee = req.query.idAnnee ? parseInt(req.query.idAnnee) : null;
  const eleve = await eleveModel.findByMatricule(req.params.matricule, idAnnee);
  if (!eleve) {
    return res.status(404).json({ message: 'Élève introuvable' });
  }
  return res.status(200).json({ data: eleve });
});

/**
 * GET /api/eleves/classe/:idClasse?idAnnee=1
 * Élèves d'une classe pour une année académique
 */
const getByClasse = asyncHandler(async (req, res) => {
  const idClasse = parseInt(req.params.idClasse);
  const idAnnee  = parseInt(req.query.idAnnee);

  if (!idAnnee) {
    return res.status(400).json({ message: 'Le paramètre idAnnee est requis' });
  }

  const eleves = await eleveModel.findByClasse(idClasse, idAnnee);
  return res.status(200).json({ total: eleves.length, data: eleves });
});

/**
 * POST /api/eleves
 * Créer un nouvel élève (avec photo optionnelle)
 */
const create = asyncHandler(async (req, res) => {
  const data = { ...req.body };
  if (req.file) data.photoURL = `/uploads/photos/${req.file.filename}`;
  data.idAdmin = req.user.id;

  const matricule = await eleveModel.create(data);
  const pool = require('../config/db');

  if (req.body.parent_id) {
    await pool.query('INSERT INTO Parents (idPers, matricule, idAdmin, created_at) VALUES (?, ?, ?, NOW())', [req.body.parent_id, matricule, data.idAdmin]);
  }

  if (req.body.classe_id) {
    const [salles] = await pool.query('SELECT idSalle FROM Salle WHERE idClasse = ? LIMIT 1', [req.body.classe_id]);
    let idSalle;
    if (salles.length > 0) {
      idSalle = salles[0].idSalle;
    } else {
      const [res] = await pool.query('INSERT INTO Salle (libelle, surface, idClasse, actif, idAdmin, created_at) VALUES (?, ?, ?, 1, ?, NOW())', ['Salle Unique', 'NON DEFINIE', req.body.classe_id, data.idAdmin]);
      idSalle = res.insertId;
    }
    const [annees] = await pool.query('SELECT idAnnee FROM AnneeAcademique WHERE statut = 1 LIMIT 1');
    const idAcademi = annees.length > 0 ? annees[0].idAnnee : 1;
    await pool.query('INSERT INTO Frequente (idSalle, idAcademi, matricule, idAdmin, created_at) VALUES (?, ?, ?, ?, NOW())', [idSalle, idAcademi, matricule, data.idAdmin]);
  }

  const eleve = await eleveModel.findByMatricule(matricule);
  return res.status(201).json({ message: 'Élève créé avec succès', eleve });
});

const update = asyncHandler(async (req, res) => {
  const matricule = req.params.matricule;
  const existing = await eleveModel.findByMatricule(matricule);
  if (!existing) return res.status(404).json({ message: 'Élève introuvable' });

  const data = { ...req.body };
  if (req.file) {
    if (existing.photoURL && existing.photoURL !== 'INDEFINI') {
      // CORRIGÉ: Retrait du slash initial pour éviter que path.join sur Windows ne crée un chemin absolu à la racine du disque
      const oldPath = path.join(__dirname, '..', '..', existing.photoURL.replace(/^\//, ''));
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    data.photoURL = `/uploads/photos/${req.file.filename}`;
  }

  await eleveModel.update(matricule, data);
  const pool = require('../config/db');

  if (req.body.parent_id !== undefined) {
    await pool.query('DELETE FROM Parents WHERE matricule = ?', [matricule]);
    if (req.body.parent_id) {
      await pool.query('INSERT INTO Parents (idPers, matricule, idAdmin, created_at) VALUES (?, ?, ?, NOW())', [req.body.parent_id, matricule, req.user.id]);
    }
  }

  if (req.body.classe_id !== undefined) {
    await pool.query('DELETE FROM Frequente WHERE matricule = ?', [matricule]);
    if (req.body.classe_id) {
      const [salles] = await pool.query('SELECT idSalle FROM Salle WHERE idClasse = ? LIMIT 1', [req.body.classe_id]);
      let idSalle;
      if (salles.length > 0) {
        idSalle = salles[0].idSalle;
      } else {
        const [res] = await pool.query('INSERT INTO Salle (libelle, surface, idClasse, actif, idAdmin, created_at) VALUES (?, ?, ?, 1, ?, NOW())', ['Salle Unique', 'NON DEFINIE', req.body.classe_id, req.user.id]);
        idSalle = res.insertId;
      }
      const [annees] = await pool.query('SELECT idAnnee FROM AnneeAcademique WHERE statut = 1 LIMIT 1');
      const idAcademi = annees.length > 0 ? annees[0].idAnnee : 1;
      await pool.query('INSERT INTO Frequente (idSalle, idAcademi, matricule, idAdmin, created_at) VALUES (?, ?, ?, ?, NOW())', [idSalle, idAcademi, matricule, req.user.id]);
    }
  }

  const updated = await eleveModel.findByMatricule(matricule);
  return res.status(200).json({ message: 'Élève mis à jour', eleve: updated });
});

/**
 * PATCH /api/eleves/:matricule/statut
 * Activer ou désactiver un élève
 * Body : { actif: 0 | 1 }
 */
const updateStatut = asyncHandler(async (req, res) => {
  const matricule = req.params.matricule;
  const actif     = parseInt(req.body.actif);

  if (![0, 1].includes(actif)) {
    return res.status(400).json({ message: 'actif doit être 0 ou 1' });
  }

  const existing = await eleveModel.findByMatricule(matricule);
  if (!existing) {
    return res.status(404).json({ message: 'Élève introuvable' });
  }

  await eleveModel.setActif(matricule, actif);
  return res.status(200).json({
    message: actif === 1 ? 'Élève activé' : 'Élève désactivé',
    matricule,
    actif,
  });
});

/**
 * DELETE /api/eleves/:matricule
 * Suppression définitive (réservé root/admin)
 * Supprime d'abord toutes les données liées avant de supprimer l'élève
 */
const remove = asyncHandler(async (req, res) => {
  const matricule = req.params.matricule;

  const existing = await eleveModel.findByMatricule(matricule);
  if (!existing) {
    return res.status(404).json({ message: 'Élève introuvable' });
  }

  if (existing.photoURL && existing.photoURL !== 'INDEFINI') {
    // CORRIGÉ: Retrait du slash initial pour éviter un chemin absolu sur Windows
    const photoPath = path.join(__dirname, '..', '..', existing.photoURL.replace(/^\//, ''));
    if (fs.existsSync(photoPath)) fs.unlinkSync(photoPath);
  }

  // Plus de suppression des données liées (FK) car c'est un soft delete
  await eleveModel.remove(matricule);

  return res.status(200).json({ message: 'Élève supprimé logiquement', matricule });
});

/**
 * PATCH /api/eleves/:matricule/restaurer
 * Restaure un élève archivé
 */
const restore = asyncHandler(async (req, res) => {
  const matricule = req.params.matricule;
  const existing = await eleveModel.findByMatricule(matricule); // findByMatricule a un isDeleted=0, on devrait utiliser une requete raw ou ajuster
  // En fait restore a juste besoin du matricule
  await eleveModel.restore(matricule);
  return res.status(200).json({ message: 'Élève restauré avec succès', matricule });
});

/**
 * GET /api/eleves/:matricule/fiche
 * Récupère toutes les infos consolidées de l'élève (Paiements, Notes, Discipline, Classe)
 */
const getFiche = asyncHandler(async (req, res) => {
  const matricule = req.params.matricule;
  const pool = require('../config/db');

  // 1. Infos personnelles + Classe actuelle
  const [eleves] = await pool.query(`
    SELECT e.*, 
           c.libelle as classe_nom, 
           s.libelle as salle_nom,
           v.libelle as ville_nom
    FROM Eleve e
    LEFT JOIN Frequente f ON e.matricule = f.matricule
    LEFT JOIN Salle s ON f.idSalle = s.idSalle
    LEFT JOIN Classe c ON s.idClasse = c.idClasse
    LEFT JOIN VilleNaissance v ON e.idVilleNaissance = v.idVille
    WHERE e.matricule = ?
    ORDER BY f.idAcademi DESC LIMIT 1
  `, [matricule]);

  if (eleves.length === 0) return res.status(404).json({ message: 'Élève introuvable' });
  const student = eleves[0];

  // 2. Parents
  const [parents] = await pool.query(`
    SELECT p.nom, p.prenom, p.mobile, p.phone, p.username
    FROM Personne p
    JOIN Parents pa ON pa.idPers = p.idPers
    WHERE pa.matricule = ?
  `, [matricule]);

  // 3. Paiements
  const [paiements] = await pool.query(`
    SELECT p.*, m.libelle as mode_nom, t.libelle as tranche_nom
    FROM Paiement p
    LEFT JOIN Mode m ON p.idMode = m.idMode
    LEFT JOIN Tranches t ON p.idTranche = t.idTranche
    WHERE p.matricule = ?
    ORDER BY p.datePaie DESC
  `, [matricule]);

  // 4. Évaluations (Notes)
  const [evals] = await pool.query(`
    SELECT ev.*, e.libelle as epreuve_nom, c.libelle as cours_nom, s.libelle as session_nom
    FROM Evaluation ev
    LEFT JOIN Epreuve e ON ev.idEpreuve = e.idEpreuve
    LEFT JOIN Cours c ON ev.idCours = c.idCours
    LEFT JOIN Session s ON ev.idSession = s.idSession
    WHERE ev.matricule = ?
    ORDER BY ev.created_at DESC
  `, [matricule]);

  // 5. Discipline (Rapports)
  const [rapports] = await pool.query(`
    SELECT r.*, p.nom as auteur_nom, p.prenom as auteur_prenom
    FROM Rapport r
    LEFT JOIN Personne p ON r.idPers = p.idPers
    WHERE r.matricule = ?
    ORDER BY r.event_date DESC
  `, [matricule]);

  return res.status(200).json({
    data: {
      student,
      parents,
      paiements,
      evaluations: evals,
      discipline: rapports
    }
  });
});

const getByCours = asyncHandler(async (req, res) => {
  const idCours = parseInt(req.query.idCours || req.params.id);
  if (!idCours) return res.status(400).json({ message: 'ID Cours requis' });
  const pool = require('../config/db');
  const [eleves] = await pool.query(`
    SELECT e.matricule, e.nom, e.prenom
    FROM Eleve e
    JOIN Frequente f ON e.matricule = f.matricule
    JOIN Salle s ON f.idSalle = s.idSalle
    JOIN Cours c ON s.idClasse = c.idClasse
    WHERE c.idCours = ? AND e.actif = 1 AND e.isDeleted = 0
    GROUP BY e.matricule
  `, [idCours]);
  return res.status(200).json({ total: eleves.length, data: eleves });
});

/**
 * DELETE /api/eleves/:matricule/hard
 * Suppression définitive d'un élève (Admin root/scolarité uniquement)
 */
const hardRemove = asyncHandler(async (req, res) => {
  const matricule = req.params.matricule;
  
  const existing = await eleveModel.findByMatricule(matricule);
  // Note: findByMatricule ne trouve que isDeleted=0 par défaut
  // Mais ici on veut peut-être supprimer un élève déjà archivé
  
  await eleveModel.hardRemove(matricule);
  return res.status(200).json({ message: 'Élève supprimé définitivement', matricule });
});

module.exports = { getAll, getOne, getByClasse, getByCours, create, update, updateStatut, remove, restore, getFiche, hardRemove };