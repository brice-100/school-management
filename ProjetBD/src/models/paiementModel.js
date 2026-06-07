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
    WHERE p.isDeleted = ?
  `;
  const params = [filters.isDeleted !== undefined ? filters.isDeleted : 0];

  if (filters.matricule) {
    query += ' AND p.matricule = ?';
    params.push(filters.matricule);
  }
  const idAca = filters.idAca || filters.idAnnee;
  if (idAca) {
    query += ' AND p.idAca = ?';
    params.push(idAca);
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
    WHERE p.isDeleted = 0
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
    WHERE pa.idPers = ? AND p.isDeleted = 0
  `;
  const params = [idPers];

  const idAca = filters.idAca || filters.idAnnee;
  if (idAca) {
    query += ' AND p.idAca = ?';
    params.push(idAca);
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
    WHERE p.idPaie = ? AND p.isDeleted = 0
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
      data.idAca || data.idAnnee || null,
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

const getSummaryByParent = async (idPers, filters = {}) => {
  const idAca = filters.idAca || filters.idAnnee;
  // 1. Calculer le total dû pour tous les enfants du parent
  // Priorité : pension/inscription de la Classe, sinon du Cycle (Scolarite)
  let dueQuery = `
    SELECT COALESCE(SUM(
      COALESCE(c.inscription, s.inscription, 0) +
      (COALESCE(c.pension, s.pension, 0) * COALESCE(s.nbreTranche, 3))
    ), 0) as totalDue
    FROM Eleve e
    JOIN Parents p ON e.matricule = p.matricule
    JOIN Frequente f ON e.matricule = f.matricule
    JOIN Salle sa ON f.idSalle = sa.idSalle
    JOIN Classe c ON sa.idClasse = c.idClasse
    LEFT JOIN Scolarite s ON s.idCycle = c.idCycle
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
    WHERE pa.idPers = ? AND p.valide = 1 AND p.isDeleted = 0
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

/**
 * Récupère le détail des paiements par enfant pour un parent
 * Retourne : nom enfant, classe, pension_due (annuelle), inscription_due, total_payé, reste
 */
const getDetailsEnfants = async (idPers, filters = {}) => {
  const idAca = filters.idAca || filters.idAnnee;

  let query = `
    SELECT 
      e.matricule,
      CONCAT(e.prenom, ' ', e.nom) as nomEleve,
      e.prenom, e.nom,
      c.libelle as classe,
      COALESCE(c.inscription, s.inscription, 0) as inscription_due,
      COALESCE(c.pension, s.pension, 0) as pension_mensuelle,
      COALESCE(s.nbreTranche, 3) as nbre_tranches,
      COALESCE(c.inscription, s.inscription, 0) + 
        (COALESCE(c.pension, s.pension, 0) * COALESCE(s.nbreTranche, 3)) as total_annuel_du,
      COALESCE(
        (SELECT SUM(pa.montant) FROM paiement pa 
         WHERE pa.matricule = e.matricule AND pa.valide = 1 AND pa.isDeleted = 0
         ${idAca ? 'AND pa.idAca = ' + pool.escape(idAca) : ''}),
        0
      ) as total_paye
    FROM Eleve e
    JOIN Parents p ON e.matricule = p.matricule
    JOIN Frequente f ON e.matricule = f.matricule
    JOIN Salle sa ON f.idSalle = sa.idSalle
    JOIN Classe c ON sa.idClasse = c.idClasse
    LEFT JOIN Scolarite s ON s.idCycle = c.idCycle
    WHERE p.idPers = ? AND e.actif = 1
  `;
  const params = [idPers];
  if (idAca) {
    query += ' AND f.idAcademi = ?';
    params.push(idAca);
  }


  const [rows] = await pool.query(query, params);
  return rows.map(r => ({
    ...r,
    total_annuel_du: parseFloat(r.total_annuel_du),
    total_paye: parseFloat(r.total_paye),
    reste_a_payer: parseFloat(r.total_annuel_du) - parseFloat(r.total_paye),
    inscription_due: parseFloat(r.inscription_due),
    pension_mensuelle: parseFloat(r.pension_mensuelle),
  }));
};

const getSituationFinanciere = async (filters = {}) => {
  const idAca = filters.idAca || filters.idAnnee;

  let query = `
    SELECT 
      e.matricule,
      CONCAT(e.prenom, ' ', e.nom) as nomEleve,
      c.libelle as classe,
      c.idClasse,
      COALESCE(c.inscription, s.inscription, 0) + 
        (COALESCE(c.pension, s.pension, 0) * COALESCE(s.nbreTranche, 3)) as total_annuel_du,
      COALESCE(
        (SELECT SUM(pa.montant) FROM paiement pa 
         WHERE pa.matricule = e.matricule AND pa.valide = 1 AND pa.isDeleted = 0
         ${idAca ? 'AND pa.idAca = ' + pool.escape(idAca) : ''}),
        0
      ) as total_paye
    FROM Eleve e
    JOIN Frequente f ON e.matricule = f.matricule
    JOIN Salle sa ON f.idSalle = sa.idSalle
    JOIN Classe c ON sa.idClasse = c.idClasse
    LEFT JOIN Scolarite s ON s.idCycle = c.idCycle
    WHERE e.actif = 1
  `;
  const params = [];
  if (idAca) {
    query += ' AND f.idAcademi = ?';
    params.push(idAca);
  }

  query += ' ORDER BY c.idClasse, e.nom, e.prenom';

  const [rows] = await pool.query(query, params);
  
  for(let i = 0; i < rows.length; i++) {
     let r = rows[i];
     r.total_annuel_du = parseFloat(r.total_annuel_du);
     r.total_paye = parseFloat(r.total_paye);
     r.reste_a_payer = r.total_annuel_du - r.total_paye;
     
     // Fetch paid tranches
     const [tranches] = await pool.query(`
        SELECT t.libelle
        FROM paiement p
        JOIN Tranches t ON p.idTranche = t.idTranche
        WHERE p.matricule = ? AND p.valide = 1 AND p.isDeleted = 0 AND p.idTranche IS NOT NULL
        ${idAca ? 'AND p.idAca = ' + pool.escape(idAca) : ''}
     `, [r.matricule]);
     
     const uniqueTranches = [...new Set(tranches.map(t => t.libelle))];
     r.tranches_payees = uniqueTranches.join(', ') || 'Aucune';
  }

  return rows;
};

const remove = async (idPaie) => {
  const [result] = await pool.query('UPDATE Paiement SET isDeleted = 1 WHERE idPaie = ?', [idPaie]);
  return result.affectedRows;
};

const restore = async (idPaie) => {
  const [result] = await pool.query('UPDATE Paiement SET isDeleted = 0 WHERE idPaie = ?', [idPaie]);
  return result.affectedRows;
};

module.exports = { findAll, findRecents, findByParent, findById, create, valider, getSummaryByParent, getDetailsEnfants, getSituationFinanciere, remove, restore };
