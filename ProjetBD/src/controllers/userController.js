const asyncHandler = require('../utils/asyncHandler');
const pool = require('../config/db');

const getPendingCount = asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT COUNT(*) as count FROM Personne WHERE actif = 0');
  res.status(200).json({ count: rows[0].count });
});

const getUsers = asyncHandler(async (req, res) => {
  const { typePersonne, search, statut } = req.query;
  let query = 'SELECT idPers as id, nom, prenom, mobile as telephone, username as email, typePersonne, actif, created_at FROM Personne WHERE 1=1';
  const params = [];
  
  if (typePersonne) {
    query += ' AND typePersonne = ?';
    params.push(typePersonne);
  }
  if (search) {
    query += ' AND (nom LIKE ? OR prenom LIKE ? OR username LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  
  query += ' ORDER BY created_at DESC';
  
  const [rows] = await pool.query(query, params);
  
  // Mappage des champs base de données vers l'attente du frontend
  const users = rows.map(r => {
    let s = 'actif';
    if (r.actif === 0) s = 'en_attente';
    if (r.actif === 2) s = 'suspendu';
    
    let roleStr = 'autre';
    if (r.typePersonne === 1) roleStr = 'teacher';
    if (r.typePersonne === 4) roleStr = 'parent';

    return {
      ...r,
      statut: s,
      role: roleStr
    };
  });
  
  // Filtrage par statut post-requête
  let filtered = users;
  if (statut) {
    filtered = users.filter(u => u.statut === statut);
  }

  res.status(200).json({ data: filtered });
});

const updateStatut = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { statut } = req.body;
  
  let actif = 1; // actif par défaut
  if (statut === 'en_attente') actif = 0;
  if (statut === 'suspendu') actif = 2;
  
  await pool.query('UPDATE Personne SET actif = ? WHERE idPers = ?', [actif, id]);
  res.status(200).json({ message: 'Statut modifié' });
});

module.exports = { getPendingCount, getUsers, updateStatut };
