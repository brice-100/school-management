-- Migration : Table MessageInterne
-- Permet aux enseignants d'envoyer des messages à l'administration
-- (remarques sur élèves, discipline, etc.)

CREATE TABLE IF NOT EXISTS `MessageInterne` (
  `idMessage`       INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `idExp_Pers`      INT UNSIGNED    NOT NULL COMMENT 'Expéditeur (Personne.idPers)',
  `objet`           VARCHAR(255)    NOT NULL,
  `contenu`         TEXT            NOT NULL,
  `type_sujet`      ENUM('eleve','discipline','autre') NOT NULL DEFAULT 'autre',
  `matricule_eleve` INT UNSIGNED    NULL     COMMENT 'Élève concerné (optionnel)',
  `lu`              TINYINT(1)      NOT NULL DEFAULT 0,
  `reponse`         TEXT            NULL     COMMENT 'Réponse de l admin',
  `idAdmin_reponse` INT UNSIGNED    NULL     COMMENT 'Admin qui a répondu',
  `repondu_at`      DATETIME        NULL,
  `created_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`idMessage`),
  INDEX `idx_exp` (`idExp_Pers`),
  INDEX `idx_eleve` (`matricule_eleve`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
