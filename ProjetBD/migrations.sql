-- ============================================================
-- MIGRATIONS SQL — Plateforme Scolaire
-- Exécuter dans l'ordre pour corriger les colonnes manquantes
-- ============================================================

-- 1. Colonne est_active sur AnneeAcademique (si pas encore faite)
ALTER TABLE AnneeAcademique ADD COLUMN IF NOT EXISTS est_active TINYINT(1) UNSIGNED NOT NULL DEFAULT 0;

-- 2. Colonne actif sur Personne (pour activation des comptes)
ALTER TABLE Personne ADD COLUMN IF NOT EXISTS actif TINYINT(1) UNSIGNED NOT NULL DEFAULT 0;

-- 3. Colonne valide sur Paiement (0=en attente, 1=validé)
ALTER TABLE Paiement ADD COLUMN IF NOT EXISTS valide TINYINT(1) UNSIGNED NOT NULL DEFAULT 0;

-- 4. Colonne idTranche sur Paiement (lien vers la tranche payée)
ALTER TABLE Paiement ADD COLUMN IF NOT EXISTS idTranche INT UNSIGNED NULL;

-- 5. Type de paiement (cash, virement, mobile_money, orange_money)
ALTER TABLE Paiement ADD COLUMN IF NOT EXISTS type_paiement VARCHAR(30) NOT NULL DEFAULT 'cash';

-- 6. Numéro de téléphone du payeur (pour Mobile Money / Orange Money)
ALTER TABLE Paiement ADD COLUMN IF NOT EXISTS phone_paiement VARCHAR(20) NULL;

-- 7. date_passage sur Session
ALTER TABLE Session ADD COLUMN IF NOT EXISTS date_passage DATE NULL;

-- 8. idAnnee sur EmploiDuTemps (si pas encore faite)
ALTER TABLE EmploiDuTemps ADD COLUMN IF NOT EXISTS idAnnee INT UNSIGNED NULL;

-- 9. Données initiales — Modes de paiement
INSERT IGNORE INTO Mode (idMode, libelle, information, actif, idFondateur, created_at)
VALUES 
  (1, 'Cash', 'Paiement en espèces directement à l''école', 1, 1, NOW()),
  (2, 'Mobile Money', 'Paiement via MTN Mobile Money', 1, 1, NOW()),
  (3, 'Orange Money', 'Paiement via Orange Money', 1, 1, NOW()),
  (4, 'Virement bancaire', 'Virement bancaire classique', 1, 1, NOW());

-- 10. Données initiales — NatureEpreuve
INSERT IGNORE INTO NatureEpreuve (idNature, libelle, description)
VALUES 
  (1, 'Contrôle Continu', 'Évaluation continue en classe'),
  (2, 'Examen', 'Examen trimestriel ou semestriel'),
  (3, 'Devoir Maison', 'Devoir à réaliser à la maison'),
  (4, 'Interrogation', 'Interrogation surprise');

-- 11. S'assurer que les années académiques existantes ont au moins une active
UPDATE AnneeAcademique SET est_active = 1 
WHERE idAnnee = (SELECT MAX(idAnnee) FROM (SELECT idAnnee FROM AnneeAcademique) AS sub)
  AND NOT EXISTS (SELECT 1 FROM (SELECT COUNT(*) as cnt FROM AnneeAcademique WHERE est_active = 1) AS chk WHERE cnt > 0);

-- 12. Conversion Matricule INT -> VARCHAR(50) (Alphanumérique)
SET FOREIGN_KEY_CHECKS = 0;

ALTER TABLE Eleve MODIFY matricule VARCHAR(50) NOT NULL;
ALTER TABLE Evaluation MODIFY matricule VARCHAR(50) NOT NULL;
ALTER TABLE Frequente MODIFY matricule VARCHAR(50) NOT NULL;
ALTER TABLE Paiement MODIFY matricule VARCHAR(50) NOT NULL;
ALTER TABLE Parents MODIFY matricule VARCHAR(50) NOT NULL;
ALTER TABLE Rapport MODIFY matricule VARCHAR(50) NOT NULL;

SET FOREIGN_KEY_CHECKS = 1;

-- Vérification finale
SELECT 'Migrations terminées avec succès' AS statut;
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'school_db'
  AND TABLE_NAME IN ('Paiement', 'Session', 'AnneeAcademique', 'Personne')
  AND COLUMN_NAME IN ('valide','idTranche','type_paiement','phone_paiement','date_passage','est_active','actif')
ORDER BY TABLE_NAME, COLUMN_NAME;
