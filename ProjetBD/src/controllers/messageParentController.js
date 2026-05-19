const asyncHandler = require('../utils/asyncHandler');
const pool = require('../config/db');

/**
 * GET /api/messages-parents
 * Récupère tous les messages associés à l'utilisateur connecté
 */
const getMessages = asyncHandler(async (req, res) => {
  const { userType, id, role } = req.user;

  let query = `
    SELECT mp.*,
      CONCAT(exp.prenom, ' ', exp.nom) AS exp_nom,
      CONCAT(dest.prenom, ' ', dest.nom) AS dest_nom,
      CONCAT(p.prenom, ' ', p.nom) AS parent_nom,
      (SELECT idPers FROM Parents pa WHERE pa.idParent = mp.idParent LIMIT 1) AS parent_idPers
    FROM MessagesParent mp
    JOIN Parents pa ON mp.idParent = pa.idParent
    JOIN Personne p ON pa.idPers = p.idPers
    LEFT JOIN Personne exp ON mp.idExp = exp.idPers
    LEFT JOIN Personne dest ON mp.idDest = dest.idPers
  `;
  const params = [];

  if (userType === 'admin') {
    // L'administrateur voit tous les messages impliquant l'administration (destType = 'admin' ou idDest NULL)
    query += " WHERE mp.destType = 'admin' OR mp.idDest IS NULL";
  } else if (userType === 'personne' && role === 4) {
    // Parent : voit les messages liés à son idParent
    const [pRows] = await pool.query('SELECT idParent FROM Parents WHERE idPers = ? LIMIT 1', [id]);
    const idParent = pRows[0] ? pRows[0].idParent : 0;
    query += ' WHERE mp.idParent = ?';
    params.push(idParent);
  } else if (userType === 'personne' && role === 1) {
    // Enseignant : voit les messages où il est le destinataire ou l'expéditeur
    query += " WHERE (mp.destType = 'teacher' AND mp.idDest = ?) OR (mp.idExp = ?)";
    params.push(id, id);
  } else {
    return res.status(403).json({ message: 'Rôle non autorisé pour la messagerie parent.' });
  }

  query += ' ORDER BY mp.created_at DESC';

  const [rows] = await pool.query(query, params);
  return res.status(200).json({ total: rows.length, data: rows });
});

/**
 * POST /api/messages-parents
 * Envoyer un nouveau message
 */
const createMessage = asyncHandler(async (req, res) => {
  const { destType, idDest, objet, contenu } = req.body;
  const idExp = req.user.id;

  if (!objet || !contenu || !destType) {
    return res.status(400).json({ message: 'Objet, contenu et type de destinataire sont requis.' });
  }

  let idParent;

  if (req.user.userType === 'personne' && req.user.role === 4) {
    // Si c'est un parent qui envoie, on retrouve son idParent
    const [pRows] = await pool.query('SELECT idParent FROM Parents WHERE idPers = ? LIMIT 1', [idExp]);
    if (!pRows[0]) {
      return res.status(400).json({ message: 'Aucun profil Parent associé.' });
    }
    idParent = pRows[0].idParent;
  } else {
    // Si c'est un enseignant ou admin qui envoie en premier à un parent, on attend idParent dans le body
    idParent = req.body.idParent;
    if (!idParent) {
      return res.status(400).json({ message: 'L\'idParent est obligatoire pour envoyer un message à un parent.' });
    }
  }

  const [result] = await pool.query(`
    INSERT INTO MessagesParent (idParent, idExp, idDest, destType, objet, contenu, created_at, lu)
    VALUES (?, ?, ?, ?, ?, ?, NOW(), 0)
  `, [idParent, idExp, idDest || null, destType, objet, contenu]);

  const [newRow] = await pool.query('SELECT * FROM MessagesParent WHERE idMsg = ?', [result.insertId]);
  return res.status(201).json({ message: 'Message envoyé avec succès', data: newRow[0] });
});

/**
 * POST /api/messages-parents/:id/repondre
 * Répondre à un message
 */
const repondreMessage = asyncHandler(async (req, res) => {
  const idMsg = parseInt(req.params.id);
  const { reponse } = req.body;
  const idPersReponse = req.user.id;

  if (!reponse) {
    return res.status(400).json({ message: 'La réponse ne peut pas être vide.' });
  }

  await pool.query(`
    UPDATE MessagesParent
    SET reponse = ?, idPersReponse = ?, repondu_at = NOW(), lu = 1
    WHERE idMsg = ?
  `, [reponse, idPersReponse, idMsg]);

  const [updatedRow] = await pool.query('SELECT * FROM MessagesParent WHERE idMsg = ?', [idMsg]);
  return res.status(200).json({ message: 'Réponse envoyée avec succès', data: updatedRow[0] });
});

/**
 * PATCH /api/messages-parents/:id/lu
 * Marquer un message comme lu
 */
const markAsLu = asyncHandler(async (req, res) => {
  const idMsg = parseInt(req.params.id);
  await pool.query('UPDATE MessagesParent SET lu = 1 WHERE idMsg = ?', [idMsg]);
  return res.status(200).json({ message: 'Message marqué comme lu' });
});

module.exports = { getMessages, createMessage, repondreMessage, markAsLu };
