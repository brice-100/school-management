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
    WHERE e.isDeleted = ?
  `;
  const params = [filters.isDeleted !== undefined ? filters.isDeleted : 0];

  if (filters.classe_id !== undefined) {
    query += ' AND s.idClasse = ?';
    params.push(filters.classe_id);
  }


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
     WHERE e.matricule = ? AND e.isDeleted = 0 LIMIT 1`;
     
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
     WHERE s.idClasse = ? AND f.idAcademi = ? AND e.isDeleted = 0
     ORDER BY e.nom ASC, e.prenom ASC`,
    [idClasse, idAnnee]
  );
  return rows;
};

const create = async (data) => {
  let {
    matricule, nom, prenom, dateNaissance, lieuNaissance,
    sexe, langue, photoURL, actif, idVilleNaissance, idAdmin
  } = data;

  // Génération automatique du matricule si absent
  if (!matricule) {
    const year = new Date().getFullYear();
    const [last] = await pool.query('SELECT matricule FROM Eleve WHERE matricule LIKE ? ORDER BY created_at DESC LIMIT 1', [`AL-${year}-%`]);
    let nextNum = 1;
    if (last.length > 0) {
      const lastMat = last[0].matricule;
      const parts = lastMat.split('-');
      const lastNum = parseInt(parts[parts.length - 1]);
      if (!isNaN(lastNum)) nextNum = lastNum + 1;
    }
    matricule = `AL-${year}-${nextNum.toString().padStart(4, '0')}`;
  }

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

  const fs = require('fs');
  const logMsg = `[${new Date().toISOString()}] --- INSERT Eleve ---\nMatricule: ${matricule}\nData: ${JSON.stringify({ nom, prenom, dateNaissance, lieuNaissance, sexe, langue, photoURL, actif, finalVilleId, idAdmin })}\n`;
  fs.appendFileSync('debug_insert.log', logMsg);

  let result;
  try {
    [result] = await pool.query(
      `INSERT INTO Eleve
         (matricule, nom, prenom, dateNaissance, lieuNaissance, sexe, langue, photoURL, actif, idVilleNaissance, idAdmin, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        matricule, nom, prenom, 
        dateNaissance || '2000-01-01', 
        lieuNaissance || 'INCONNU', 
        sexe ?? 0,
        langue || 'NON DEFINI', photoURL || 'INDEFINI', actif ?? 1,
        finalVilleId, idAdmin
      ]
    );
  } catch (err) {
    fs.appendFileSync('debug_insert.log', `ERROR: ${err.message}\n${err.stack}\n`);
    throw err;
  }

  return matricule || result.insertId;
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

  let result;
  params.push(matricule);
  try {
    const fs = require('fs');
    fs.appendFileSync('debug_update.log', `[${new Date().toISOString()}] UPDATE Eleve matricule=${matricule} data=${JSON.stringify(data)}\n`);
    [result] = await pool.query(
      `UPDATE Eleve SET ${fields.join(', ')} WHERE matricule = ?`,
      params
    );
  } catch (err) {
    const fs = require('fs');
    fs.appendFileSync('debug_update.log', `ERROR: ${err.message}\n${err.stack}\n`);
    throw err;
  }
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
 * Restaure un élève.
 * @param {number} matricule
 */
const restore = async (matricule) => {
  const [result] = await pool.query(
    'UPDATE Eleve SET isDeleted = 0 WHERE matricule = ?',
    [matricule]
  );
  return result.affectedRows;
};

/**
 * Supprime logiquement un élève (soft delete).
 * @param {number} matricule
 */
const remove = async (matricule) => {
  const [result] = await pool.query(
    'UPDATE Eleve SET isDeleted = 1 WHERE matricule = ?',
    [matricule]
  );
  return result.affectedRows;
};

/**
 * Suppression définitive d'un élève et de toutes ses données liées.
 * @param {string} matricule
 */
const hardRemove = async (matricule) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    
    // Supprimer les données liées dans l'ordre pour respecter les FK
    await conn.query('DELETE FROM Parents WHERE matricule = ?', [matricule]);
    await conn.query('DELETE FROM Frequente WHERE matricule = ?', [matricule]);
    await conn.query('DELETE FROM Evaluation WHERE matricule = ?', [matricule]);
    await conn.query('DELETE FROM Paiement WHERE matricule = ?', [matricule]);
    await conn.query('DELETE FROM messageinterne WHERE matricule_eleve = ?', [matricule]);
    await conn.query('DELETE FROM Rapport WHERE matricule = ?', [matricule]);
    
    const [result] = await conn.query('DELETE FROM Eleve WHERE matricule = ?', [matricule]);
    
    await conn.commit();
    return result.affectedRows;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

/**
 * Génère le prochain matricule d'une classe spécifique
 */
const generateNextMatricule = async (idClasse) => {
  const year = new Date().getFullYear();
  let prefix = 'AL';
  
  if (idClasse) {
    const [classes] = await pool.query('SELECT libelle FROM Classe WHERE idClasse = ? LIMIT 1', [idClasse]);
    if (classes.length > 0) {
      const nomClasse = classes[0].libelle;
      // Nettoyer et prendre le diminutif (ex: "Petite section" -> "PS", "CP" -> "CP")
      const mots = nomClasse.trim().split(/\s+/);
      if (mots.length > 1) {
        prefix = mots.map(m => m[0]).join('').toUpperCase();
      } else {
        prefix = nomClasse.substring(0, 3).toUpperCase();
      }
    }
  }

  const basePrefix = `${prefix}-${year}-`;
  const [last] = await pool.query('SELECT matricule FROM Eleve WHERE matricule LIKE ? ORDER BY created_at DESC LIMIT 1', [`${basePrefix}%`]);
  
  let nextNum = 1;
  if (last.length > 0) {
    const lastMat = last[0].matricule;
    const parts = lastMat.split('-');
    const lastNum = parseInt(parts[parts.length - 1]);
    if (!isNaN(lastNum)) nextNum = lastNum + 1;
  }
  
  return `${basePrefix}${nextNum.toString().padStart(3, '0')}`;
};

module.exports = { findAll, findByMatricule, findByClasse, create, update, setActif, remove, restore, hardRemove, generateNextMatricule };