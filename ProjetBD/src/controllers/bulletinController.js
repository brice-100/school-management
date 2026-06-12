const asyncHandler = require('../utils/asyncHandler');
const pool = require('../config/db');

/**
 * GET /api/bulletins/:id?trimestre=1&annee_scolaire=2024-2025
 */
const getBulletinData = asyncHandler(async (req, res) => {
  const matricule      = req.params.id;
  const trimestreNum   = parseInt(req.query.trimestre) || 1;   // 1, 2 ou 3
  const idAnneeContext = req.idAnnee || 1; // Injecté par anneeMiddleware

  // 1. Trouver l'idTrimes correct et le libellé de l'année
  const [trimestres] = await pool.query(`
    SELECT t.idTrimes, t.libelle, aa.libelle as annee_libelle
    FROM Trimestre t
    JOIN AnneeAcademique aa ON t.idAca = aa.idAnnee
    WHERE aa.idAnnee = ?
    ORDER BY t.idTrimes ASC
  `, [idAnneeContext]);

  let idTrimes = null;
  let annee_scolaire = req.query.annee_scolaire || '2024-2025';

  if (trimestres.length > 0) {
    annee_scolaire = trimestres[0].annee_libelle; // Toujours utiliser le vrai libellé de la DB
    const idx = trimestreNum - 1;
    if (trimestres[idx]) {
      idTrimes = trimestres[idx].idTrimes;
    } else {
      idTrimes = trimestres[trimestres.length - 1].idTrimes;
    }
  }

  // 2. Infos élève synchronisées avec l'année
  const [students] = await pool.query(`
    SELECT 
      e.matricule, e.nom, e.prenom, e.photoURL AS photo,
      e.dateNaissance AS date_naissance, e.lieuNaissance AS lieu_naissance,
      c.libelle AS classe_nom,
      p.nom AS parent_nom, p.prenom AS parent_prenom,
      p.mobile AS telephone, p.photo AS parent_photo,
      p_tit.nom AS enseignant_nom, p_tit.prenom AS enseignant_prenom,
      (SELECT COUNT(*) FROM Frequente f2 WHERE f2.idSalle = f.idSalle AND f2.idAcademi = ?) AS effectif
    FROM Eleve e
    LEFT JOIN Frequente f  ON f.matricule = e.matricule AND f.idAcademi = ?
    LEFT JOIN Salle s      ON s.idSalle = f.idSalle
    LEFT JOIN Classe c     ON c.idClasse = s.idClasse
    LEFT JOIN Parents pr   ON pr.matricule = e.matricule
    LEFT JOIN Personne p   ON p.idPers = pr.idPers
    LEFT JOIN Titulaire t  ON t.idSalle = s.idSalle AND t.idAnnee = ? AND t.actif = 1
    LEFT JOIN Personne p_tit ON p_tit.idPers = t.idPers
    WHERE e.matricule = ?
    LIMIT 1
  `, [idAnneeContext, idAnneeContext, idAnneeContext, matricule]);

  if (students.length === 0) {
    return res.status(404).json({ message: 'Élève introuvable' });
  }
  const student = students[0];

  // 3. Évaluations groupées par matière
  let groupedNotes = [];
  if (idTrimes) {
    const [evRows] = await pool.query(`
      SELECT 
        ev.idEval,
        ev.note AS valeur,
        ev.appreciation AS commentaire,
        c.idCours,
        c.libelle AS matiere_nom,
        c.coefficient,
        ep.libelle AS epreuve_nom
      FROM Evaluation ev
      JOIN Cours c         ON ev.idCours = c.idCours
      JOIN Session s       ON ev.idSession = s.idSession
      JOIN Epreuve ep      ON ev.idEpreuve = ep.idEpreuve
      WHERE ev.matricule = ?
        AND s.idTrimestre = ?
        AND ev.valider = 1
      ORDER BY c.libelle, ev.created_at ASC
    `, [matricule, idTrimes]);

    // Groupement
    const map = new Map();
    evRows.forEach(row => {
      if (!map.has(row.idCours)) {
        map.set(row.idCours, {
          idCours: row.idCours,
          matiere_nom: row.matiere_nom,
          coefficient: row.coefficient,
          seq1: null,
          seq2: null,
          comp: null,
          all_notes: []
        });
      }
      const m = map.get(row.idCours);
      m.all_notes.push(row.valeur);
      
      const lib = row.epreuve_nom.toLowerCase();
      if (lib.includes('seq1') || lib.includes('séquence 1')) m.seq1 = row.valeur;
      else if (lib.includes('seq2') || lib.includes('séquence 2')) m.seq2 = row.valeur;
      else if (lib.includes('comp') || lib.includes('exam')) m.comp = row.valeur;
      else {
        if (m.seq1 === null) m.seq1 = row.valeur;
        else if (m.seq2 === null) m.seq2 = row.valeur;
        else if (m.comp === null) m.comp = row.valeur;
      }
    });
    
    groupedNotes = Array.from(map.values()).map(m => {
      const count = (m.seq1 !== null ? 1 : 0) + (m.seq2 !== null ? 1 : 0) + (m.comp !== null ? 1 : 0);
      const sum = (m.seq1 || 0) + (m.seq2 || 0) + (m.comp || 0);
      const moy = count > 0 ? (sum / count) : 0;
      return { ...m, moyenne_matiere: moy };
    });
  }

  // 4. Calcul moyenne générale pondérée
  let sumNotes = 0;
  let sumCoeff = 0;
  groupedNotes.forEach(n => {
    const coeff = parseFloat(n.coefficient) || 1;
    sumNotes += n.moyenne_matiere * coeff;
    sumCoeff += coeff;
  });
  
  const moyenneGen = sumCoeff > 0 ? (sumNotes / sumCoeff) : 0;

  function getMention(m) {
    if (m >= 16) return 'Très Bien';
    if (m >= 14) return 'Bien';
    if (m >= 12) return 'Assez Bien';
    if (m >= 10) return 'Passable';
    return 'Insuffisant';
  }

  // 5. Statistiques de classe synchronisées
  let classStats = {
    moyenneMax: '0.00',
    moyenneMin: '0.00',
    moyenneClasse: '0.00',
    tauxReussite: '0%',
    rang: '—'
  };

  const [classSalles] = await pool.query('SELECT idSalle FROM Frequente WHERE matricule = ? AND idAcademi = ? LIMIT 1', [matricule, idAnneeContext]);
  if (classSalles.length > 0 && idTrimes) {
    const idSalle = classSalles[0].idSalle;
    const [allMoyennes] = await pool.query(`
      SELECT 
        e.matricule,
        SUM(ev.note * c.coefficient) / SUM(c.coefficient) as moyenne
      FROM Eleve e
      JOIN Frequente f ON e.matricule = f.matricule AND f.idAcademi = ?
      JOIN Evaluation ev ON e.matricule = ev.matricule
      JOIN Cours c ON ev.idCours = c.idCours
      JOIN Session s ON ev.idSession = s.idSession
      WHERE f.idSalle = ? AND s.idTrimestre = ? AND ev.valider = 1
      GROUP BY e.matricule
      ORDER BY moyenne DESC
    `, [idAnneeContext, idSalle, idTrimes]);

    if (allMoyennes.length > 0) {
      const moys = allMoyennes.map(m => parseFloat(m.moyenne));
      classStats.moyenneMax = Math.max(...moys).toFixed(2);
      classStats.moyenneMin = Math.min(...moys).toFixed(2);
      classStats.moyenneClasse = (moys.reduce((a, b) => a + b, 0) / moys.length).toFixed(2);
      classStats.tauxReussite = ((moys.filter(m => m >= 10).length / moys.length) * 100).toFixed(0) + '%';
      
      const rankIdx = allMoyennes.findIndex(m => m.matricule === matricule);
      classStats.rang = rankIdx !== -1 ? (rankIdx + 1) : '—';
    }
  }

  // 6. Calcul dynamique Conduite
  let absencesTotales = 0;
  let absencesNJ = 0;
  let exclusions = 0;
  let hasAvertissementConduite = false;
  let hasBlameConduite = false;

  const [reports] = await pool.query(`
    SELECT r.*,
      (SELECT COUNT(*) FROM justificatifs j WHERE j.idRapport = r.idRap AND j.idDirecteur IS NOT NULL) > 0 AS justifie
    FROM rapport r
    WHERE r.matricule = ? AND r.idAca = ?
  `, [matricule, idAnneeContext]);

  const trimesterReports = reports.filter(r => {
    if (!r.event_date) return false;
    const date = new Date(r.event_date);
    const month = date.getMonth() + 1; // 1-12

    if (trimestreNum === 1) return month >= 9 && month <= 12;
    else if (trimestreNum === 2) return month >= 1 && month <= 3;
    else return month >= 4 && month <= 8;
  });

  trimesterReports.forEach(r => {
    const lib = r.libelle.toLowerCase();
    if (lib.includes('absence') || lib.includes('absent')) {
      const hoursMatch = lib.match(/(\d+)\s*h/);
      const hours = hoursMatch ? parseInt(hoursMatch[1]) : 2;
      absencesTotales += hours;
      if (!r.justifie) absencesNJ += hours;
    }
    if (lib.includes('exclusion') || lib.includes('exclu')) {
      const daysMatch = lib.match(/(\d+)\s*(j|jour)/);
      const days = daysMatch ? parseInt(daysMatch[1]) : 1;
      exclusions += days;
    }
    if (lib.includes('avertissement') || lib.includes('conduite') || r.points >= 5) {
      hasAvertissementConduite = true;
    }
    if (lib.includes('blâme') || lib.includes('blame') || r.points >= 10) {
      hasBlameConduite = true;
    }
  });

  return res.status(200).json({
    data: {
      trimestre: trimestreNum,
      annee_scolaire,
      student: {
        ...student,
        enseignant_nom: student.enseignant_nom ? `${student.enseignant_prenom} ${student.enseignant_nom}` : null
      },
      moyenne: moyenneGen.toFixed(2),
      mention: getMention(moyenneGen),
      admis: moyenneGen >= 10,
      notes: groupedNotes,
      stats: classStats,
      travail: {
        tableauHonneur: (moyenneGen >= 12 && !hasBlameConduite) ? 'Oui' : 'Non',
        encouragement: (moyenneGen >= 14 && !hasBlameConduite) ? 'Oui' : 'Non',
        felicitation: (moyenneGen >= 16 && !hasBlameConduite) ? 'Oui' : 'Non',
        avertissement: moyenneGen < 9 ? 'Oui' : 'Non',
        blame: moyenneGen < 7 ? 'Oui' : 'Non'
      },
      conduite: {
        absencesTotales: absencesTotales + ' H',
        absencesNJ: absencesNJ + ' H',
        exclusions: exclusions + ' Jrs',
        avertissement: hasAvertissementConduite ? 'Oui' : 'Non',
        blame: hasBlameConduite ? 'Oui' : 'Non'
      }
    }
  });
});

const downloadBulletinPDF = asyncHandler(async (req, res) =>
  res.status(200).send('PDF placeholder')
);

module.exports = { getBulletinData, downloadBulletinPDF };
