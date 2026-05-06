const pool = require('../config/db');

/**
 * Récupère tous les élèves avec leur ville de naissance.
 * @param {object} filters - { actif, idAdmin }
 */
const findAll = async (filters = {}) => {
  let query = `
    SELECT e.*, e.matricule AS id, v.libelle AS villeNaissance,
      e.dateNaissance AS date_naissance,
      CONCAT(pp.prenom, ' ', pp.nom) as parent_nom,
      pp.mobile as parent_tel,
      c.libelle as classe_nom
    FROM Eleve e
    LEFT JOIN VilleNaissance v ON e.idVilleNaissance = v.idVille
    LEFT JOIN Parents pa ON e.matricule = pa.matricule
    LEFT JOIN Personne pp ON pa.idPers = pp.idPers
    LEFT JOIN Frequente f ON e.matricule = f.matricule ${filters.idAnnee ? 'AND f.idAcademi = ?' : ''}
    LEFT JOIN Salle s ON f.idSalle = s.idSalle
    LEFT JOIN Classe c ON s.idClasse = c.idClasse
    WHERE 1=1
  `;
  const params = [];

  if (filters.actif !== undefined) {
    query += ' AND e.actif = ?';
    params.push(filters.actif);
  }
  if (filters.idAnnee !== undefined) {
    params.unshift(filters.idAnnee); // Placé au début car utilisé dans le JOIN
  }
  if (filters.idAdmin !== undefined) {
    query += ' AND e.idAdmin = ?';
    params.push(filters.idAdmin);
  }

  query += ' ORDER BY e.nom ASC, e.prenom ASC';

  const [rows] = await pool.query(query, params);
  return rows;
};

const findByMatricule = async (matricule, idAnnee = null) => {
  let query = `SELECT e.*, v.libelle AS villeNaissance, p.idPers as parent_id, s.idClasse as classe_id
     FROM Eleve e
     LEFT JOIN VilleNaissance v ON e.idVilleNaissance = v.idVille
     LEFT JOIN Parents p ON p.matricule = e.matricule
     LEFT JOIN Frequente f ON (f.matricule = e.matricule ${idAnnee ? 'AND f.idAcademi = ?' : ''})
     LEFT JOIN Salle s ON s.idSalle = f.idSalle
     WHERE e.matricule = ? LIMIT 1`;
     
  const params = idAnnee ? [idAnnee, matricule] : [matricule];
  
  const [rows] = await pool.query(query, params);
  return rows[0] || null;
};

/**
 * Récupère les élèves d'une classe via la table Frequente → Salle → Classe.
 * @param {number} idClasse
 * @param {number} idAnnee
 */
const findByClasse = async (idClasse, idAnnee) => {
  const [rows] = await pool.query(
    `SELECT e.*, v.libelle AS villeNaissance
     FROM Eleve e
     JOIN Frequente f ON e.matricule = f.matricule
     JOIN Salle s     ON f.idSalle   = s.idSalle
     LEFT JOIN VilleNaissance v ON e.idVilleNaissance = v.idVille
     WHERE s.idClasse = ? AND f.idAcademi = ?
     ORDER BY e.nom ASC, e.prenom ASC`,
    [idClasse, idAnnee]
  );
  return rows;
};

const create = async (data) => {
  const {
    nom, prenom, dateNaissance, lieuNaissance,
    sexe, langue, photoURL, actif,
    idVilleNaissance, idAdmin,
  } = data;

  let finalVilleId = idVilleNaissance;
  if (!finalVilleId) {
    const [villes] = await pool.query('SELECT idVille FROM VilleNaissance LIMIT 1');
    if (villes.length > 0) {
      finalVilleId = villes[0].idVille;
    } else {
      const [res] = await pool.query('INSERT INTO VilleNaissance (libelle) VALUES (?)', ['INCONNU']);
      finalVilleId = res.insertId;
    }
  }

  const [result] = await pool.query(
    `INSERT INTO Eleve
       (nom, prenom, dateNaissance, lieuNaissance, sexe, langue, photoURL, actif, idVilleNaissance, idAdmin, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [
      nom, prenom, 
      dateNaissance || '2000-01-01', 
      lieuNaissance || 'INCONNU', 
      sexe ?? 0,
      langue || 'NON DEFINI', photoURL || 'INDEFINI', actif ?? 1,
      finalVilleId, idAdmin
    ]
  );
  return result.insertId;
};

/**
 * Met à jour un élève existant.
 * @param {number} matricule
 * @param {object} data
 */
const update = async (matricule, data) => {
  const fields = [];
  const params = [];

  const allowed = [
    'nom', 'prenom', 'dateNaissance', 'lieuNaissance',
    'sexe', 'langue', 'photoURL', 'actif', 'idVilleNaissance',
  ];

  for (const key of allowed) {
    if (data[key] !== undefined) {
      fields.push(`${key} = ?`);
      params.push(data[key]);
    }
  }

  if (fields.length === 0) return 0;

  params.push(matricule);
  const [result] = await pool.query(
    `UPDATE Eleve SET ${fields.join(', ')} WHERE matricule = ?`,
    params
  );
  return result.affectedRows;
};

/**
 * Active ou désactive un élève (soft delete).
 * @param {number} matricule
 * @param {number} actif - 0 ou 1
 */
const setActif = async (matricule, actif) => {
  const [result] = await pool.query(
    'UPDATE Eleve SET actif = ? WHERE matricule = ?',
    [actif, matricule]
  );
  return result.affectedRows;
};

/**
 * Supprime toutes les données liées à un élève (dans le bon ordre FK).
 * @param {number} matricule
 */
const removeRelated = async (matricule) => {
  await pool.query('DELETE FROM Evaluation WHERE matricule = ?', [matricule]);
  await pool.query('DELETE FROM Rapport    WHERE matricule = ?', [matricule]);
  await pool.query('DELETE FROM Paiement   WHERE matricule = ?', [matricule]);
  await pool.query('DELETE FROM Frequente  WHERE matricule = ?', [matricule]);
  await pool.query('DELETE FROM Parents    WHERE matricule = ?', [matricule]);
};

/**
 * Supprime définitivement un élève (à utiliser avec précaution).
 * @param {number} matricule
 */
const remove = async (matricule) => {
  const [result] = await pool.query(
    'DELETE FROM Eleve WHERE matricule = ?',
    [matricule]
  );
  return result.affectedRows;
};

module.exports = { findAll, findByMatricule, findByClasse, create, update, setActif, removeRelated, remove };