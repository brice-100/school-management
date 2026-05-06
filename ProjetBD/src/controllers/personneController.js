const asyncHandler = require('../utils/asyncHandler');
const pool = require('../config/db');

const getPersonnes = asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM Personne WHERE actif = 1');
  res.status(200).json({ data: rows });
});

const updateStatut = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { actif } = req.body;
  await pool.query('UPDATE Personne SET actif = ? WHERE idPers = ?', [actif, id]);
  res.status(200).json({ message: 'Statut modifié' });
});

const deletePersonne = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Supprimer les dépendances potentielles
  await pool.query('DELETE FROM Titulaire WHERE idPers = ?', [id]);
  await pool.query('DELETE FROM Parents WHERE idPers = ?', [id]);
  await pool.query('DELETE FROM Enseignant WHERE idPers = ?', [id]);
  
  const [result] = await pool.query('DELETE FROM Personne WHERE idPers = ?', [id]);
  
  if (result.affectedRows === 0) {
    return res.status(404).json({ message: 'Compte introuvable' });
  }
  
  res.status(200).json({ message: 'Compte supprimé définitivement' });
});

module.exports = { getPersonnes, updateStatut, deletePersonne };
