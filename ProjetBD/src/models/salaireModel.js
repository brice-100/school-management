const pool = require('../config/db');

const findAll = async (filters = {}) => {
  let query = `
    SELECT s.*, p.nom, p.prenom, p.username as teacher_email
    FROM salaires s
    JOIN Enseignant e ON s.teacher_id = e.idEnseignant
    JOIN Personne p ON e.idPers = p.idPers
    WHERE 1=1
  `;
  const params = [];

  if (filters.annee) {
    query += ' AND s.annee = ?';
    params.push(filters.annee);
  }
  if (filters.mois) {
    query += ' AND s.mois = ?';
    params.push(filters.mois);
  }
  if (filters.statut) {
    query += ' AND s.statut = ?';
    params.push(filters.statut);
  }

  query += ' ORDER BY s.created_at DESC';
  const [rows] = await pool.query(query, params);
  
  // Adapter les noms de champs pour le frontend
  return rows.map(r => ({
    ...r,
    teacher_nom: r.nom,
    teacher_prenom: r.prenom
  }));
};

const findById = async (id) => {
  const [rows] = await pool.query(`
    SELECT s.*, p.nom, p.prenom, p.username as teacher_email
    FROM salaires s
    JOIN Enseignant e ON s.teacher_id = e.idEnseignant
    JOIN Personne p ON e.idPers = p.idPers
    WHERE s.id = ?
  `, [id]);
  if (!rows[0]) return null;
  return {
    ...rows[0],
    teacher_nom: rows[0].nom,
    teacher_prenom: rows[0].prenom
  };
};

const create = async (data) => {
  const [result] = await pool.query(
    'INSERT INTO salaires (teacher_id, montant, mois, annee, statut, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
    [data.teacher_id, data.montant, data.mois, data.annee, data.statut || 'non_paye']
  );
  return result.insertId;
};

const update = async (id, data) => {
  const fields = [];
  const params = [];
  const allowed = ['montant', 'mois', 'annee', 'statut', 'date_paiement'];
  
  for (const key of allowed) {
    if (data[key] !== undefined) {
      fields.push(`${key} = ?`);
      params.push(data[key]);
    }
  }

  if (fields.length === 0) return 0;
  params.push(id);

  const [result] = await pool.query(
    `UPDATE salaires SET ${fields.join(', ')} WHERE id = ?`,
    params
  );
  return result.affectedRows;
};

const remove = async (id) => {
  const [result] = await pool.query('DELETE FROM salaires WHERE id = ?', [id]);
  return result.affectedRows;
};

const getRecap = async (filters = {}) => {
  let query = `
    SELECT 
      COUNT(*) as total_fiches,
      SUM(montant) as total_montant,
      SUM(CASE WHEN statut = 'paye' THEN montant ELSE 0 END) as total_paye,
      SUM(CASE WHEN statut = 'non_paye' THEN montant ELSE 0 END) as total_restant
    FROM salaires
    WHERE 1=1
  `;
  const params = [];
  if (filters.annee) { query += ' AND annee = ?'; params.push(filters.annee); }
  if (filters.mois) { query += ' AND mois = ?'; params.push(filters.mois); }

  const [rows] = await pool.query(query, params);
  return rows[0];
};

module.exports = { findAll, findById, create, update, remove, getRecap };
