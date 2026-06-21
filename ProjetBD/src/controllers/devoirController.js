const asyncHandler = require('../utils/asyncHandler');
const pool = require('../config/db');

/**
 * GET /api/devoirs
 * Filtres possibles : idSalle, idCours, matricule (trouve la salle de l'élève)
 */
const getDevoirs = asyncHandler(async (req, res) => {
  const { idSalle, idCours, matricule } = req.query;
  const currentAnnee = req.idAnnee || null;

  let query = `
    SELECT d.*, 
      c.libelle AS cours_nom,
      s.libelle AS salle_nom,
      cl.libelle AS classe_nom,
      CONCAT(p.prenom, ' ', p.nom) AS enseignant_nom
    FROM Devoirs d
    JOIN Cours c ON d.idCours = c.idCours
    JOIN Salle s ON d.idSalle = s.idSalle
    JOIN Classe cl ON s.idClasse = cl.idClasse
    JOIN Personne p ON d.idPers = p.idPers
    WHERE 1=1
  `;
  const params = [];

  if (idSalle) {
    query += ' AND d.idSalle = ?';
    params.push(parseInt(idSalle));
  } else if (matricule) {
    // Si filtré par matricule (cas du parent qui regarde pour un enfant),
    // on trouve la salle de l'élève pour l'année scolaire en cours.
    query += ` AND d.idSalle IN (
      SELECT idSalle FROM Frequente WHERE matricule = ? AND (idAcademi = ? OR ? IS NULL)
    )`;
    params.push(matricule, currentAnnee, currentAnnee);
  }

  if (idCours) {
    query += ' AND d.idCours = ?';
    params.push(parseInt(idCours));
  }

  // Filtrer par enseignant si c'est un enseignant connecté et qu'il veut ses devoirs
  if (req.user.userType === 'personne' && req.user.role === 1) {
    query += ' AND d.idPers = ?';
    params.push(req.user.id);
  }

  query += ' ORDER BY d.created_at DESC';

  const [rows] = await pool.query(query, params);
  return res.status(200).json({ total: rows.length, data: rows });
});

/**
 * POST /api/devoirs
 */
const createDevoir = asyncHandler(async (req, res) => {
  const { titre, description, idCours, idSalle, date_rendu } = req.body;
  const idPers = req.user.id; // L'enseignant connecté

  if (!titre || !idCours || !idSalle) {
    return res.status(400).json({ message: 'Titre, matière et classe sont obligatoires.' });
  }

  const urlDoc = req.file ? `/uploads/epreuves/${req.file.filename}` : (req.body.urlDoc || null);

  const [result] = await pool.query(`
    INSERT INTO Devoirs (titre, description, idCours, idSalle, idPers, date_rendu, urlDoc, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
  `, [titre, description || null, parseInt(idCours), parseInt(idSalle), idPers, date_rendu || null, urlDoc]);

  const [newRow] = await pool.query('SELECT * FROM Devoirs WHERE idDevoir = ?', [result.insertId]);

  return res.status(201).json({ message: 'Devoir publié avec succès', data: newRow[0] });
});

/**
 * PUT /api/devoirs/:id
 */
const updateDevoir = asyncHandler(async (req, res) => {
  const idDevoir = parseInt(req.params.id);
  const { titre, description, idCours, idSalle, date_rendu } = req.body;

  // Si c'est un enseignant, on vérifie qu'il est bien l'auteur du devoir
  if (req.user.userType === 'personne' && req.user.role === 1) {
    const [existing] = await pool.query('SELECT idPers FROM Devoirs WHERE idDevoir = ?', [idDevoir]);
    if (!existing[0] || existing[0].idPers !== req.user.id) {
      return res.status(403).json({ message: "Vous n'êtes pas autorisé à modifier ce devoir." });
    }
  }

  let urlDoc = req.body.urlDoc;
  if (req.file) {
    urlDoc = `/uploads/epreuves/${req.file.filename}`;
  }

  await pool.query(`
    UPDATE Devoirs
    SET titre = ?, description = ?, idCours = ?, idSalle = ?, date_rendu = ?, urlDoc = ?
    WHERE idDevoir = ?
  `, [titre, description || null, parseInt(idCours), parseInt(idSalle), date_rendu || null, urlDoc || null, idDevoir]);

  const [updatedRow] = await pool.query('SELECT * FROM Devoirs WHERE idDevoir = ?', [idDevoir]);
  return res.status(200).json({ message: 'Devoir modifié avec succès', data: updatedRow[0] });
});

/**
 * DELETE /api/devoirs/:id
 */
const deleteDevoir = asyncHandler(async (req, res) => {
  const idDevoir = parseInt(req.params.id);

  // Si c'est un enseignant, on vérifie qu'il est bien l'auteur du devoir
  if (req.user.userType === 'personne' && req.user.role === 1) {
    const [existing] = await pool.query('SELECT idPers FROM Devoirs WHERE idDevoir = ?', [idDevoir]);
    if (!existing[0] || existing[0].idPers !== req.user.id) {
      return res.status(403).json({ message: "Vous n'êtes pas autorisé à supprimer ce devoir." });
    }
  }

  await pool.query('DELETE FROM Devoirs WHERE idDevoir = ?', [idDevoir]);
  return res.status(200).json({ message: 'Devoir supprimé avec succès' });
});

module.exports = { getDevoirs, createDevoir, updateDevoir, deleteDevoir };
