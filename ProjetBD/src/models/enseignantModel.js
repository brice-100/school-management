const pool = require('../config/db');

/**
 * Récupère tous les enseignants (Personne avec typePersonne = 1)
 * avec leur cours assigné.
 */
const findAll = async (filters = {}) => {
  let query = `
    SELECT 
      p.idPers, p.idPers AS id, p.nom, p.prenom, p.dateNaissance, p.lieuNaissance,
      p.mobile, p.mobile AS telephone, p.phone, p.username, p.username AS email, 
      p.alanyaID, p.created_at, p.actif AS person_actif,
      e.idEnseignant, e.idCours, e.Actif AS actif,
      c.libelle AS matiere_nom,
      COALESCE(
        (SELECT cl.libelle FROM Titulaire ti JOIN Salle sa ON ti.idSalle = sa.idSalle JOIN Classe cl ON sa.idClasse = cl.idClasse WHERE ti.idPers = p.idPers LIMIT 1),
        (SELECT cl.libelle FROM Classe cl WHERE cl.idClasse = c.idClasse LIMIT 1)
      ) AS classe_nom

    FROM Personne p
    LEFT JOIN Enseignant e ON p.idPers = e.idPers
    LEFT JOIN Cours c ON e.idCours = c.idCours
    WHERE p.typePersonne = 1 AND p.isDeleted = ?
  `;
  const params = [filters.isDeleted !== undefined ? filters.isDeleted : 0];

  if (filters.actif !== undefined) {
    query += ' AND COALESCE(e.Actif, p.actif) = ?';
    params.push(filters.actif);
  }

  if (filters.search) {
    query += ' AND (p.nom LIKE ? OR p.prenom LIKE ? OR p.username LIKE ?)';
    const s = `%${filters.search}%`;
    params.push(s, s, s);
  }

  query += ' ORDER BY p.nom ASC, p.prenom ASC';

  const [rows] = await pool.query(query, params);
  return rows;
};

/**
 * Récupère un enseignant par idEnseignant.
 * @param {number} idEnseignant
 */
const findById = async (idEnseignant) => {
  const [rows] = await pool.query(
    `SELECT
       p.idPers, p.idPers AS id, p.nom, p.prenom, p.dateNaissance, p.lieuNaissance,
       p.mobile, p.mobile AS telephone, p.phone, p.username, p.username AS email, p.alanyaID, p.created_at, p.photo,
       e.idEnseignant, e.idCours, e.Actif AS actif,
       c.libelle AS matiere_nom,
       (SELECT cl.idClasse FROM Titulaire ti JOIN Salle sa ON ti.idSalle = sa.idSalle JOIN Classe cl ON sa.idClasse = cl.idClasse WHERE ti.idPers = p.idPers LIMIT 1) AS classe_id,
       COALESCE(
         (SELECT cl.libelle FROM Titulaire ti JOIN Salle sa ON ti.idSalle = sa.idSalle JOIN Classe cl ON sa.idClasse = cl.idClasse WHERE ti.idPers = p.idPers LIMIT 1),
         (SELECT cl.libelle FROM Classe cl WHERE cl.idClasse = c.idClasse LIMIT 1)
       ) AS classe_nom
     FROM Personne p
     LEFT JOIN Enseignant e ON p.idPers = e.idPers
     LEFT JOIN Cours c ON e.idCours = c.idCours
     WHERE (e.idEnseignant = ? OR p.idPers = ?) AND p.typePersonne = 1 AND p.isDeleted = 0 LIMIT 1`,
    [idEnseignant, idEnseignant]
  );
  return rows[0] || null;
};

/**
 * Récupère un enseignant par idPers.
 * @param {number} idPers
 */
const findByIdPers = async (idPers) => {
  const [rows] = await pool.query(
    `SELECT
       p.idPers, p.nom, p.prenom, p.dateNaissance, p.lieuNaissance,
       p.mobile, p.phone, p.username, p.alanyaID,
       e.idEnseignant, e.idEnseignant AS id, e.idCours, e.Actif AS actif,
       c.libelle AS coursLibelle
     FROM Personne p
     JOIN Enseignant e ON p.idPers = e.idPers
     LEFT JOIN Cours c ON e.idCours = c.idCours
     WHERE p.idPers = ? AND p.isDeleted = 0 LIMIT 1`,
    [idPers]
  );
  return rows[0] || null;
};

/**
 * Vérifie si un username est déjà pris.
 * @param {string} username
 * @param {number|null} excludeIdPers - Pour exclure l'utilisateur courant lors d'un update
 */
const isUsernameTaken = async (username, excludeIdPers = null) => {
  let query = 'SELECT idPers FROM Personne WHERE username = ?';
  const params = [username];
  if (excludeIdPers) {
    query += ' AND idPers != ?';
    params.push(excludeIdPers);
  }
  const [rows] = await pool.query(query, params);
  return rows.length > 0;
};

/**
 * Crée une Personne puis une entrée Enseignant.
 * @param {object} personneData
 * @param {object} enseignantData
 * @returns {{ idPers, idEnseignant }}
 */
const create = async (personneData, enseignantData) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Insérer dans Personne
    const [p] = await conn.query(
      `INSERT INTO Personne
         (nom, prenom, dateNaissance, lieuNaissance, mobile, phone,
          typePersonne, username, password, alanyaID, idAdmin, photo, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, NOW())`,
      [
        personneData.nom, personneData.prenom, personneData.dateNaissance,
        personneData.lieuNaissance, personneData.mobile || '000',
        personneData.phone || '000', personneData.username,
        personneData.password, personneData.alanyaID || null,
        personneData.idAdmin, personneData.photo || null,
      ]
    );
    const idPers = p.insertId;

    // 2. Insérer dans Enseignant
    const [e] = await conn.query(
      `INSERT INTO Enseignant (idPers, idCours, Actif, idAdmin, created_at)
       VALUES (?, ?, 1, ?, NOW())`,
      [idPers, enseignantData.idCours, enseignantData.idAdmin]
    );
    const idEnseignant = e.insertId;

    await conn.commit();
    return { idPers, idEnseignant };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

/**
 * Met à jour les informations de la Personne liée à un enseignant.
 * @param {number} idPers
 * @param {object} data
 */
const updatePersonne = async (idPers, data) => {
  const fields = [];
  const params = [];

  const allowed = ['nom', 'prenom', 'dateNaissance', 'lieuNaissance', 'mobile', 'phone', 'alanyaID'];
  for (const key of allowed) {
    if (data[key] !== undefined) {
      fields.push(`${key} = ?`);
      params.push(data[key]);
    }
  }

  if (fields.length === 0) return 0;
  params.push(idPers);

  const [result] = await pool.query(
    `UPDATE Personne SET ${fields.join(', ')} WHERE idPers = ?`,
    params
  );
  return result.affectedRows;
};

const updateCours = async (idPers, idCours, idAdmin = 1) => {
  // Vérifier si une entrée existe déjà dans Enseignant pour cette Personne
  const [rows] = await pool.query('SELECT idEnseignant FROM Enseignant WHERE idPers = ?', [idPers]);
  
  if (rows.length > 0) {
    // Mise à jour
    const [result] = await pool.query(
      'UPDATE Enseignant SET idCours = ? WHERE idPers = ?',
      [idCours, idPers]
    );
    return result.affectedRows;
  } else {
    // Création de l'entrée manquante (ex: auto-inscription)
    const [result] = await pool.query(
      'INSERT INTO Enseignant (idPers, idCours, Actif, idAdmin, created_at) VALUES (?, ?, 1, ?, NOW())',
      [idPers, idCours, idAdmin]
    );
    return result.insertId;
  }
};

/**
 * Active ou désactive un enseignant.
 * @param {number} idEnseignant
 * @param {number} actif - 0 ou 1
 */
const setActif = async (id, actif) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    // 1. On cherche l'idPers lié si c'est un idEnseignant
    const [ens] = await conn.query('SELECT idPers FROM Enseignant WHERE idEnseignant = ?', [id]);
    const actualIdPers = ens.length > 0 ? ens[0].idPers : id;

    // 2. On met à jour les deux tables
    await conn.query('UPDATE Enseignant SET Actif = ? WHERE idEnseignant = ? OR idPers = ?', [actif, id, actualIdPers]);
    await conn.query('UPDATE Personne SET actif = ? WHERE idPers = ?', [actif, actualIdPers]);

    await conn.commit();
    return 1;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

/**
 * Restaure un enseignant.
 */
const restore = async (idPers) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('UPDATE Enseignant SET isDeleted = 0 WHERE idPers = ?', [idPers]);
    await conn.query('UPDATE Personne SET isDeleted = 0 WHERE idPers = ?', [idPers]);
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

/**
 * Supprime logiquement un enseignant et sa Personne associée.
 * @param {number} idEnseignant
 * @param {number} idPers
 */
const remove = async (idEnseignant, idPers) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    
    // 2. Supprimer logiquement de la table Enseignant
    await conn.query('UPDATE Enseignant SET isDeleted = 1 WHERE idEnseignant = ?', [idEnseignant]);
    
    // 3. Supprimer logiquement de la table Personne
    await conn.query('UPDATE Personne SET isDeleted = 1 WHERE idPers = ?', [idPers]);
    
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

module.exports = {
  findAll, findById, findByIdPers, isUsernameTaken,
  create, updatePersonne, updateCours, setActif, remove, restore
};
