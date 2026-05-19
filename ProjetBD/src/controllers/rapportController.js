const asyncHandler = require('../utils/asyncHandler');
const pool = require('../config/db');

const getRapports = asyncHandler(async (req, res) => {
  const { matricule, idAca } = req.query;
  
  let query = `
    SELECT r.*, 
      CONCAT(e.nom, ' ', e.prenom) AS nomEleve,
      (SELECT COUNT(*) FROM justificatifs j WHERE j.idRapport = r.idRap AND j.idDirecteur IS NOT NULL) > 0 AS justifie
    FROM rapport r
    LEFT JOIN Eleve e ON e.matricule = r.matricule
    WHERE 1=1
  `;
  const params = [];
  
  if (matricule) {
    query += ' AND r.matricule = ?';
    params.push(matricule);
  }
  if (idAca) {
    query += ' AND r.idAca = ?';
    params.push(parseInt(idAca));
  }
  
  // Si c'est un parent, on ne montre que ses propres enfants!
  if (req.user.role === 4 || req.user.role === 'parent') {
    query += ` AND r.matricule IN (
      SELECT matricule FROM Parents WHERE idPers = ?
    )`;
    params.push(req.user.id);
  }
  
  query += ' ORDER BY r.created_at DESC';
  
  const [rows] = await pool.query(query, params);
  return res.status(200).json({ rapports: rows, data: rows });
});

const getRapportsCours = asyncHandler(async (req, res) => {
  return res.status(200).json({ data: [] });
});

const createRapport = asyncHandler(async (req, res) => {
  const { libelle, points, matricule, idAca, event_date, commentaire, idDiscipline, status } = req.body;
  
  let finalPoints = parseInt(points) || 0;
  if (idDiscipline) {
    const [dis] = await pool.query('SELECT points FROM discipline WHERE ID = ?', [idDiscipline]);
    if (dis[0]) {
      finalPoints = dis[0].points;
    }
  }
  
  const [result] = await pool.query(`
    INSERT INTO rapport (libelle, points, matricule, idAca, commentaire, event_date, idPers, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
  `, [libelle, finalPoints, matricule, parseInt(idAca) || 1, commentaire || null, event_date || null, req.user.id, status || 'Enregistré']);
  
  return res.status(201).json({ message: 'Rapport créé', data: { idRap: result.insertId } });
});

const updateRapport = asyncHandler(async (req, res) => {
  const idRap = parseInt(req.params.id);
  const { libelle, commentaire, status, points } = req.body;
  
  const fields = ['libelle = ?', 'commentaire = ?'];
  const params = [libelle, commentaire || null];

  if (status) {
    fields.push('status = ?');
    params.push(status);
  }

  if (points !== undefined) {
    fields.push('points = ?');
    params.push(parseInt(points) || 0);
  }

  params.push(idRap);

  await pool.query(`
    UPDATE rapport 
    SET ${fields.join(', ')}
    WHERE idRap = ?
  `, params);
  
  return res.status(200).json({ message: 'Rapport modifié', data: { idRap } });
});

const getJustificatifs = asyncHandler(async (req, res) => {
  const idRapport = parseInt(req.query.idRapport || req.params.id);
  
  const [rows] = await pool.query(`
    SELECT * FROM justificatifs 
    WHERE idRapport = ? 
    ORDER BY created_at DESC
  `, [idRapport]);
  
  return res.status(200).json({ justificatifs: rows, data: rows });
});

const createJustificatif = asyncHandler(async (req, res) => {
  const { idRapport, commentaire, urlDoc } = req.body;
  
  const [result] = await pool.query(`
    INSERT INTO justificatifs (idRapport, commentaire, urlDoc, created_at)
    VALUES (?, ?, ?, NOW())
  `, [parseInt(idRapport), commentaire, urlDoc || null]);
  
  return res.status(201).json({ message: 'Justificatif créé', data: { ID: result.insertId } });
});

const validerJustificatif = asyncHandler(async (req, res) => {
  const idJustif = parseInt(req.params.id);
  const idAdmin = req.user.id;

  // 1. Mettre à jour le justificatif avec l'ID du directeur/administrateur connecté
  await pool.query(`
    UPDATE justificatifs 
    SET idDirecteur = ?
    WHERE ID = ?
  `, [idAdmin, idJustif]);

  // 2. Mettre à jour le statut du rapport associé à 'Validé'
  const [justifRow] = await pool.query('SELECT idRapport FROM justificatifs WHERE ID = ?', [idJustif]);
  if (justifRow[0]) {
    await pool.query(`
      UPDATE rapport
      SET status = 'Validé'
      WHERE idRap = ?
    `, [justifRow[0].idRapport]);
  }

  return res.status(200).json({ message: 'Justificatif validé et statut du rapport mis à jour.' });
});

const getDisciplines = asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM discipline ORDER BY libelle ASC');
  return res.status(200).json({ disciplines: rows, data: rows });
});

module.exports = { 
  getRapports, 
  getRapportsCours, 
  createRapport, 
  updateRapport, 
  getJustificatifs, 
  createJustificatif, 
  validerJustificatif,
  getDisciplines 
};
