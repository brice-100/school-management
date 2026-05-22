const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const pool = require('../config/db');

router.use(authMiddleware.protect);

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Specialite');
    res.json({ data: rows });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { libelle } = req.body;
    if (!libelle) return res.status(400).json({ message: 'Le libellé est requis.' });
    
    // Only admins are supposed to create specialites via LibraryPage
    const idAdmin = req.user.userType === 'admin' ? req.user.id : 1; 

    const [result] = await pool.query('INSERT INTO Specialite (libelle, idAdmin) VALUES (?, ?)', [libelle, idAdmin]);
    res.status(201).json({ message: 'Spécialité créée', data: { idSpecialite: result.insertId, libelle, idAdmin } });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

module.exports = router;
