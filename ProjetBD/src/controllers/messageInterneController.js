const asyncHandler = require('../utils/asyncHandler');
const pool = require('../config/db');

/**
 * GET /api/messages-internes
 * - Admin : voit tous les messages
 * - Enseignant : voit seulement ses messages
 */
const getAll = asyncHandler(async (req, res) => {
  const { userType, id, role } = req.user;

  let query = `
    SELECT 
      mi.*,
      p.nom AS exp_nom,
      p.prenom AS exp_prenom,
      e2.nom AS eleve_nom,
      e2.prenom AS eleve_prenom
    FROM MessageInterne mi
    LEFT JOIN Personne p ON mi.idExp_Pers = p.idPers
    LEFT JOIN Eleve e2 ON mi.matricule_eleve = e2.matricule
  `;
  const params = [];

  // Enseignant : seulement ses propres messages
  if (userType === 'personne' && role === 1) {
    query += ' WHERE mi.idExp_Pers = ?';
    params.push(id);
  }

  query += ' ORDER BY mi.created_at DESC';

  const [rows] = await pool.query(query, params);
  return res.status(200).json({ total: rows.length, data: rows });
});

/**
 * GET /api/messages-internes/:id
 */
const getOne = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT mi.*, p.nom AS exp_nom, p.prenom AS exp_prenom,
      e2.nom AS eleve_nom, e2.prenom AS eleve_prenom
     FROM MessageInterne mi
     LEFT JOIN Personne p ON mi.idExp_Pers = p.idPers
     LEFT JOIN Eleve e2 ON mi.matricule_eleve = e2.matricule
     WHERE mi.idMessage = ?`,
    [parseInt(req.params.id)]
  );
  if (!rows[0]) return res.status(404).json({ message: 'Message introuvable' });
  return res.status(200).json({ data: rows[0] });
});

/**
 * POST /api/messages-internes
 * Envoi d'un message par un enseignant
 */
const create = asyncHandler(async (req, res) => {
  const { objet, contenu, type_sujet, matricule_eleve } = req.body;
  const idExp_Pers = req.user.id;

  if (!objet || !contenu) {
    return res.status(400).json({ message: 'Objet et contenu sont obligatoires' });
  }

  const [result] = await pool.query(
    `INSERT INTO MessageInterne (idExp_Pers, objet, contenu, type_sujet, matricule_eleve, created_at)
     VALUES (?, ?, ?, ?, ?, NOW())`,
    [idExp_Pers, objet, contenu, type_sujet || 'autre', matricule_eleve || null]
  );

  const [rows] = await pool.query(
    'SELECT * FROM MessageInterne WHERE idMessage = ?',
    [result.insertId]
  );

  return res.status(201).json({ message: 'Message envoyé avec succès', data: rows[0] });
});

/**
 * PATCH /api/messages-internes/:id/lu
 * Marquer un message comme lu (admin uniquement)
 */
const markAsLu = asyncHandler(async (req, res) => {
  await pool.query(
    'UPDATE MessageInterne SET lu = 1 WHERE idMessage = ?',
    [parseInt(req.params.id)]
  );
  return res.status(200).json({ message: 'Message marqué comme lu' });
});

/**
 * POST /api/messages-internes/:id/repondre
 * L'admin répond à un message enseignant
 */
const repondre = asyncHandler(async (req, res) => {
  const { reponse } = req.body;
  const idAdmin_reponse = req.user.id;

  if (!reponse) {
    return res.status(400).json({ message: 'La réponse ne peut pas être vide' });
  }

  await pool.query(
    `UPDATE MessageInterne 
     SET reponse = ?, idAdmin_reponse = ?, repondu_at = NOW(), lu = 1
     WHERE idMessage = ?`,
    [reponse, idAdmin_reponse, parseInt(req.params.id)]
  );

  const [rows] = await pool.query(
    'SELECT * FROM MessageInterne WHERE idMessage = ?',
    [parseInt(req.params.id)]
  );

  return res.status(200).json({ message: 'Réponse envoyée', data: rows[0] });
});

/**
 * DELETE /api/messages-internes/:id
 */
const remove = asyncHandler(async (req, res) => {
  await pool.query(
    'DELETE FROM MessageInterne WHERE idMessage = ?',
    [parseInt(req.params.id)]
  );
  return res.status(200).json({ message: 'Message supprimé' });
});

module.exports = { getAll, getOne, create, markAsLu, repondre, remove };
