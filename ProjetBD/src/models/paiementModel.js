const pool = require('../config/db');

/**
 * Récupère tous les paiements avec filtres optionnels
 */
const findAll = async (filters = {}) => {
  let query = `
    SELECT p.*,
      CONCAT(e.prenom, ' ', e.nom) as nomEleve,
      e.prenom as eleve_prenom, e.nom as eleve_nom,
      m.libelle as libelleMode,
      t.libelle as libelleTranche
    FROM paiement p
    LEFT JOIN Eleve e ON p.matricule = e.matricule
    LEFT JOIN Mode m ON p.idMode = m.idMode
    LEFT JOIN Tranches t ON p.idTranche = t.idTranche
    WHERE 1=1
  `;
  const params = [];

  if (filters.matricule) {
    query += ' AND p.matricule = ?';
    params.push(filters.matricule);
  }
  if (filters.idAca) {
    query += ' AND p.idAca = ?';
    params.push(filters.idAca);
  }
  const valFilter = filters.valide !== undefined && filters.valide !== '' ? filters.valide : filters.statut;
  if (valFilter !== undefined && valFilter !== '') {
    query += ' AND p.valide = ?';
    params.push(parseInt(valFilter));
  }
  if (filters.idMode) {
    query += ' AND p.idMode = ?';
    params.push(filters.idMode);
  }

  query += ' ORDER BY p.dateEnregistrer DESC';
  const [rows] = await pool.query(query, params);
  return rows;
};

/**
 * Récupère les paiements récents (limite configurable)
 */
const findRecents = async (limit = 10) => {
  const [rows] = await pool.query(`
    SELECT p.*,
      CONCAT(e.prenom, ' ', e.nom) as nomEleve,
      m.libelle as libelleMode
    FROM Paiement p
    LEFT JOIN Eleve e ON p.matricule = e.matricule
    LEFT JOIN Mode m ON p.idMode = m.idMode
    ORDER BY p.dateEnregistrer DESC
    LIMIT ?
  `, [parseInt(limit)]);
  return rows;
};

/**
 * Récupère les paiements des enfants d'un parent donné
 */
const findByParent = async (idPers, filters = {}) => {
  let query = `
    SELECT p.*,
      CONCAT(e.prenom, ' ', e.nom) as nomEleve,
      m.libelle as libelleMode,
      t.libelle as libelleTranche
    FROM paiement p
    JOIN Eleve e ON p.matricule = e.matricule
    JOIN Parents pa ON pa.matricule = e.matricule
    LEFT JOIN Mode m ON p.idMode = m.idMode
    LEFT JOIN Tranches t ON p.idTranche = t.idTranche
    WHERE pa.idPers = ?
  `;
  const params = [idPers];

  if (filters.idAca) {
    query += ' AND p.idAca = ?';
    params.push(filters.idAca);
  }

  query += ' ORDER BY p.dateEnregistrer DESC';
  const [rows] = await pool.query(query, params);
  return rows;
};

const findById = async (idPaie) => {
  const [rows] = await pool.query(`
    SELECT p.*,
      CONCAT(e.prenom, ' ', e.nom) as nomEleve,
      m.libelle as libelleMode,
      t.libelle as libelleTranche
    FROM Paiement p
    LEFT JOIN Eleve e ON p.matricule = e.matricule
    LEFT JOIN Mode m ON p.idMode = m.idMode
    LEFT JOIN Tranches t ON p.idTranche = t.idTranche
    WHERE p.idPaie = ?
  `, [idPaie]);
  return rows[0] || null;
};

const create = async (data) => {
  const [result] = await pool.query(
    `INSERT INTO Paiement
      (matricule, idAca, montant, url, comentaire, idMode, idTranche,
       type_paiement, phone_paiement, operation_ID, idPers, datePaie, dateEnregistrer, valide)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 0)`,
    [
      data.matricule,
      data.idAca || null,
      data.montant,
      data.url || '',
      data.comentaire || '',
      data.idMode,
      data.idTranche || null,
      data.type_paiement || 'cash',
      data.phone_paiement || null,
      data.operation_ID || '',
      data.idPers,
      data.datePaie || new Date().toISOString().split('T')[0],
    ]
  );
  return result.insertId;
};

/**
 * Valide un paiement (met valide = 1)
 */
const valider = async (idPaie, modeReglement) => {
  const [result] = await pool.query(
    'UPDATE Paiement SET valide = 1, type_paiement = ? WHERE idPaie = ?',
    [modeReglement || 'cash', idPaie]
  );
  return result.affectedRows;
};

const getSummaryByParent = async (idPers, idAca = null) => {
  // 1. Calculer le total dû (Scolarité) pour tous les enfants du parent
  let dueQuery = `
    SELECT COALESCE(SUM(s.inscription + s.pension), 0) as totalDue
    FROM Eleve e
    JOIN Parents p ON e.matricule = p.matricule
    JOIN Frequente f ON e.matricule = f.matricule
    JOIN Salle sa ON f.idSalle = sa.idSalle
    JOIN Classe c ON sa.idClasse = c.idClasse
    JOIN Scolarite s ON s.idCycle = c.idCycle
    WHERE p.idPers = ? AND e.actif = 1
  `;
  const dueParams = [idPers];
  if (idAca) {
    dueQuery += ' AND f.idAcademi = ?';
    dueParams.push(idAca);
  }
  const [[{ totalDue }]] = await pool.query(dueQuery, dueParams);

  // 2. Calculer le total payé (Paiements validés)
  let paidQuery = `
    SELECT COALESCE(SUM(p.montant), 0) as totalPaid
    FROM paiement p
    JOIN Parents pa ON p.matricule = pa.matricule
    WHERE pa.idPers = ? AND p.valide = 1
  `;
  const paidParams = [idPers];
  if (idAca) {
    paidQuery += ' AND p.idAca = ?';
    paidParams.push(idAca);
  }
  const [[{ totalPaid }]] = await pool.query(paidQuery, paidParams);

  return {
    totalDue: parseFloat(totalDue),
    totalPaid: parseFloat(totalPaid),
    remaining: parseFloat(totalDue) - parseFloat(totalPaid)
  };
};

module.exports = { findAll, findRecents, findByParent, findById, create, valider, getSummaryByParent };
