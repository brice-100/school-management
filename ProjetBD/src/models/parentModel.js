const pool = require('../config/db');

const findAll = async (filters = {}) => {
  let query = `
    SELECT 
      p.idPers, p.idPers AS id, p.nom, p.prenom, p.mobile, p.phone, p.username, p.actif,
      pa.idParent, 
      JSON_ARRAYAGG(
        IF(e.matricule IS NOT NULL, 
          JSON_OBJECT('matricule', e.matricule, 'nom', e.nom, 'prenom', e.prenom),
          NULL
        )
      ) as enfants
    FROM Personne p
    LEFT JOIN Parents pa ON p.idPers = pa.idPers
    LEFT JOIN Eleve e ON pa.matricule = e.matricule
    WHERE p.typePersonne = 4
  `;
  const params = [];
  if (filters.actif !== undefined) {
    query += ' AND p.actif = ?';
    params.push(filters.actif);
  }
  query += ' GROUP BY p.idPers, p.nom, p.prenom, p.mobile, p.phone, p.username, p.actif, pa.idParent ORDER BY p.nom ASC, p.prenom ASC';
  const [rows] = await pool.query(query, params);
  return rows;
};

const findById = async (idParent) => {
  const [rows] = await pool.query(`
    SELECT p.*, pa.idParent, 
      JSON_ARRAYAGG(
        JSON_OBJECT('matricule', e.matricule, 'nom', e.nom, 'prenom', e.prenom)
      ) as enfants
    FROM Personne p
    LEFT JOIN Parents pa ON p.idPers = pa.idPers
    LEFT JOIN Eleve e ON pa.matricule = e.matricule
    WHERE (pa.idParent = ? OR p.idPers = ?)
    GROUP BY p.idPers, pa.idParent
    LIMIT 1
  `, [idParent, idParent]);
  return rows[0] || null;
};

const create = async (personneData, matricule, idAdmin) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [p] = await conn.query(
      `INSERT INTO Personne 
        (nom, prenom, dateNaissance, lieuNaissance, mobile, phone, typePersonne, username, password, alanyaID, idAdmin, photo, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 4, ?, ?, ?, ?, ?, NOW())`,
      [
        personneData.nom, personneData.prenom, personneData.dateNaissance || '2000-01-01', 
        personneData.lieuNaissance || 'INDEFINI', personneData.mobile || '000', personneData.phone || '000', 
        personneData.username, personneData.password, personneData.alanyaID || null, idAdmin, personneData.photo || 'INDEFINI'
      ]
    );
    const idPers = p.insertId;

    const [pa] = await conn.query(
      'INSERT INTO Parents (idPers, matricule, idAdmin, created_at) VALUES (?, ?, ?, NOW())',
      [idPers, matricule, idAdmin]
    );
    const idParent = pa.insertId;

    await conn.commit();
    return idParent;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

const updatePersonne = async (idPers, data) => {
  const fields = [];
  const params = [];
  const allowed = ['nom', 'prenom', 'mobile', 'phone', 'password', 'photo'];
  for (const key of allowed) {
    if (data[key] !== undefined) {
      fields.push(`${key} = ?`);
      params.push(data[key]);
    }
  }
  if (fields.length === 0) return 0;
  params.push(idPers);
  const [result] = await pool.query(`UPDATE Personne SET ${fields.join(', ')} WHERE idPers = ?`, params);
  return result.affectedRows;
};

const setActif = async (id, actif) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    // 1. On cherche l'idPers lié si c'est un idParent
    const [pa] = await conn.query('SELECT idPers FROM Parents WHERE idParent = ?', [id]);
    const actualIdPers = pa.length > 0 ? pa[0].idPers : id;

    // 2. On met à jour Personne
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

const findChildrenByParentIdPers = async (idPers) => {
  const [rows] = await pool.query(`
    SELECT e.*, c.libelle as classe, s.libelle as salle
    FROM Eleve e
    JOIN Parents pa ON e.matricule = pa.matricule
    LEFT JOIN Frequente f ON e.matricule = f.matricule
    LEFT JOIN Salle s ON f.idSalle = s.idSalle
    LEFT JOIN Classe c ON s.idClasse = c.idClasse
    WHERE pa.idPers = ?
    ORDER BY f.idAcademi DESC
  `, [idPers]);
  
  // Éliminer les doublons si un élève est dans plusieurs années (garder la plus récente)
  const map = new Map();
  rows.forEach(r => {
    if (!map.has(r.matricule)) map.set(r.matricule, r);
  });
  return Array.from(map.values());
};

module.exports = { findAll, findById, findChildrenByParentIdPers, create, updatePersonne, setActif };
