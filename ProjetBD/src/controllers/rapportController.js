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
  if (req.user.role === 'parent') {
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
  const { libelle, points, matricule, idAca, event_date, commentaire, idDiscipline } = req.body;
  
  let finalPoints = parseInt(points) || 0;
  if (idDiscipline) {
    const [dis] = await pool.query('SELECT points FROM discipline WHERE ID = ?', [idDiscipline]);
    if (dis[0]) {
      finalPoints = dis[0].points;
    }
  }
  
  const [result] = await pool.query(`
    INSERT INTO rapport (libelle, points, matricule, idAca, commentaire, event_date, idPers, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
  `, [libelle, finalPoints, matricule, parseInt(idAca) || 1, commentaire || null, event_date || null, req.user.id]);
  
  return res.status(201).json({ message: 'Rapport créé', data: { idRap: result.insertId } });
});

const updateRapport = asyncHandler(async (req, res) => {
  const idRap = parseInt(req.params.id);
  const { libelle, commentaire } = req.body;
  
  await pool.query(`
    UPDATE rapport 
    SET libelle = ?, commentaire = ?
    WHERE idRap = ?
  `, [libelle, commentaire || null, idRap]);
  
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

const getDisciplines = asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM discipline ORDER BY libelle ASC');
  return res.status(200).json({ disciplines: rows, data: rows });
});

module.exports = { getRapports, getRapportsCours, createRapport, updateRapport, getJustificatifs, createJustificatif, getDisciplines };
