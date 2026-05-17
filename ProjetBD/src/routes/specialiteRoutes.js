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

module.exports = router;
