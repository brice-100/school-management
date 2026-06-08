const pool = require('./src/config/db');

(async () => {
  try {
    console.log('🔎 Recherche des évaluations suspectes...');

    const [suspects] = await pool.query(`
      SELECT ev.idEval, ev.matricule, ev.note, ev.idSession, ev.idAnnee,
             s.idSession AS session_exists, t.idAca AS session_annee
      FROM Evaluation ev
      LEFT JOIN Session s ON ev.idSession = s.idSession
      LEFT JOIN Trimestre t ON s.idTrimestre = t.idTrimes
      WHERE ev.idSession IN (1, 2, 3)
        AND (
          s.idSession IS NULL
          OR t.idAca != ev.idAnnee
        )
      ORDER BY ev.idEval ASC
    `);

    if (suspects.length === 0) {
      console.log('✅ Aucun enregistrement suspect trouvé.');
      process.exit(0);
    }

    console.log(`⚠️  ${suspects.length} évaluation(s) suspecte(s) trouvée(s).`);

    let updated = 0;

    for (const ev of suspects) {
      const ordinal = Math.min(Math.max(parseInt(ev.idSession, 10) || 1, 1), 3);
      const [targetSessions] = await pool.query(`
        SELECT s.idSession
        FROM Session s
        JOIN Trimestre t ON s.idTrimestre = t.idTrimes
        WHERE t.idAca = ?
        ORDER BY s.idSession ASC
        LIMIT 1 OFFSET ?
      `, [ev.idAnnee, ordinal - 1]);

      if (!targetSessions[0]) {
        console.warn(`⚠️  Evaluation ${ev.idEval} : aucune session trouvée pour idAnnee=${ev.idAnnee}, ordinal=${ordinal}`);
        continue;
      }

      const correctSessionId = targetSessions[0].idSession;
      if (correctSessionId === ev.idSession) {
        console.log(`ℹ️  Evaluation ${ev.idEval} est déjà liée à la bonne session (${correctSessionId}).`);
        continue;
      }

      await pool.query('UPDATE Evaluation SET idSession = ? WHERE idEval = ?', [correctSessionId, ev.idEval]);
      console.log(`✅ Evaluation ${ev.idEval} corrigée : idSession ${ev.idSession} → ${correctSessionId}`);
      updated += 1;
    }

    console.log(`
✔️  Correction terminée. ${updated} évaluation(s) mise(s) à jour.`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur pendant la correction :', error.message);
    process.exit(1);
  }
})();
