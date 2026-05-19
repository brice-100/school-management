-- Active: 1774340325784@@127.0.0.1@3306@mysql
CREATE TABLE `Admin`  (
  `ID` int UNSIGNED NOT NULL,
  `nom` varchar(100) NOT NULL DEFAULT 'Root',
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `actif` tinyint(1) UNSIGNED NOT NULL DEFAULT 1,
  `typeAdmin` smallint UNSIGNED NOT NULL COMMENT '0 = root, 1 = Admin, 2 = Fondateur , 3 = Directeur',
  `mobile` varchar(15) NOT NULL,
  `alanyaID` varchar(15) NOT NULL,
  `created_at` datetime NOT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`ID`)
);

CREATE TABLE `AnneeAcademique`  (
  `idAnnee` int UNSIGNED NOT NULL,
  `libelle` varchar(200) NOT NULL,
  `periode` varchar(255) NOT NULL,
  `created_at` date NOT NULL,
  `idAdmin` int UNSIGNED NOT NULL,
  PRIMARY KEY (`idAnnee`)
);

CREATE TABLE `Classe`  (
  `idClasse` int UNSIGNED NOT NULL,
  `libelle` varchar(100) NOT NULL DEFAULT 'INDEFINI',
  `idCycle` int UNSIGNED NOT NULL,
  `idAdmin` int UNSIGNED NOT NULL,
  `created_at` datetime NOT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idClasse`)
);

CREATE TABLE `Cours`  (
  `idCours` int UNSIGNED NOT NULL,
  `libelle` varchar(255) NOT NULL,
  `note` float UNSIGNED NOT NULL DEFAULT 0,
  `coefficient` float UNSIGNED NOT NULL DEFAULT 1,
  `description` text NOT NULL,
  `idClasse` int UNSIGNED NOT NULL,
  `actif` tinyint(1) UNSIGNED NOT NULL DEFAULT 1,
  `idAdmin` int UNSIGNED NOT NULL,
  `created_at` datetime NOT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idCours`)
);

CREATE TABLE `Cycle`  (
  `idCycle` int UNSIGNED NOT NULL,
  `libelle` varchar(255) NOT NULL,
  `description` tinytext CHARACTER SET utf8mb4 NOT NULL,
  `idAdmin` int UNSIGNED NOT NULL,
  `created` datetime NOT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idCycle`)
);

CREATE TABLE `Discipline`  (
  `ID` int UNSIGNED NOT NULL,
  `libelle` varchar(255) CHARACTER SET utf8mb4 NOT NULL,
  `points` int UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (`ID` DESC)
);

CREATE TABLE `Eleve`  (
  `matricule` int UNSIGNED NOT NULL,
  `nom` varchar(60) NOT NULL,
  `prenom` varchar(60) NOT NULL,
  `dateNaissance` date NOT NULL,
  `lieuNaissance` varchar(30) NOT NULL,
  `sexe` smallint UNSIGNED NOT NULL DEFAULT 0 COMMENT '0 = fille, 1 = garcon, 2 = autres',
  `langue` varchar(30) NOT NULL DEFAULT 'NON DEFINI',
  `photoURL` varchar(255) NOT NULL DEFAULT 'INDEFINI',
  `actif` tinyint(1) UNSIGNED NOT NULL DEFAULT 0,
  `idVilleNaissance` int UNSIGNED NOT NULL,
  `idAdmin` int UNSIGNED NOT NULL,
  `created_at` datetime NOT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`matricule`)
);

CREATE TABLE `EmploiDuTemps`  (
  `idTemps` int UNSIGNED NOT NULL,
  `jour` varchar(30) NOT NULL,
  `heure` varchar(6) NOT NULL,
  `idClasse` int UNSIGNED NOT NULL,
  `idCours` int UNSIGNED NOT NULL,
  `idAdmin` int UNSIGNED NOT NULL,
  `created_at` datetime NOT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idTemps`)
);

CREATE TABLE `Enseignant`  (
  `idEnseignant` int UNSIGNED NOT NULL,
  `idPers` int UNSIGNED NOT NULL,
  `idCours` int UNSIGNED NOT NULL,
  `Actif` tinyint(1) UNSIGNED NOT NULL DEFAULT 1,
  `idAdmin` int UNSIGNED NOT NULL,
  `created_at` datetime NOT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idEnseignant`)
);

CREATE TABLE `Epreuve`  (
  `idEpreuve` int UNSIGNED NOT NULL,
  `libelle` varchar(255) NOT NULL,
  `urlDoc` varchar(255) NOT NULL DEFAULT 'INDEFINI',
  `auteur` varchar(255) NOT NULL DEFAULT 'INDEFINI',
  `idNature` int UNSIGNED NOT NULL,
  `idPers` int UNSIGNED NOT NULL,
  `created_at` datetime NOT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idEpreuve`)
);

CREATE TABLE `Evaluation`  (
  `idEval` int UNSIGNED NOT NULL,
  `note` float NOT NULL DEFAULT 0,
  `appreciation` varchar(255) NOT NULL,
  `matricule` int UNSIGNED NOT NULL,
  `idEpreuve` int UNSIGNED NOT NULL,
  `idCours` int UNSIGNED NOT NULL,
  `idSession` int UNSIGNED NOT NULL,
  `idPers` int UNSIGNED NOT NULL,
  `created_at` datetime NOT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idEval`)
);

CREATE TABLE `FicheEnseignant`  (
  `idRap` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `idEnseignant` int UNSIGNED NOT NULL,
  `libelle` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
  `points` int UNSIGNED NOT NULL,
  `idAdministratif` int UNSIGNED NOT NULL,
  `idAca` int UNSIGNED NOT NULL,
  `commentaire` text CHARACTER SET utf8mb4 NOT NULL,
  `event_date` date NOT NULL,
  `created_at` datetime NOT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idRap` DESC)
);

CREATE TABLE `Frequente`  (
  `idFrequente` int UNSIGNED NOT NULL,
  `idSalle` int UNSIGNED NOT NULL,
  `idAcademi` int UNSIGNED NOT NULL,
  `matricule` int UNSIGNED NOT NULL,
  `commentaire` varchar(255) NOT NULL DEFAULT 'RAS',
  `idAdmin` int NOT NULL,
  `created_at` datetime NOT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idFrequente`)
);

CREATE TABLE `JourSemaine`  (
  `ID` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `libelle` varchar(15) NOT NULL,
  PRIMARY KEY (`ID`)
);

CREATE TABLE `Justificatifs`  (
  `ID` int UNSIGNED NOT NULL,
  `idRapport` int UNSIGNED NOT NULL,
  `commentaire` text CHARACTER SET utf8mb4 NOT NULL,
  `idDirecteur` int UNSIGNED NULL,
  `urlDoc` varchar(255) NULL,
  `created_at` datetime NOT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`ID`)
);

CREATE TABLE `Livres`  (
  `idLivre` int UNSIGNED NOT NULL,
  `titre` varchar(255) NOT NULL,
  `auteurs` varchar(255) NOT NULL DEFAULT 'INDEFINI',
  `prix` float UNSIGNED NOT NULL DEFAULT 0,
  `idSpecialite` int UNSIGNED NOT NULL,
  `edition` varchar(255) NOT NULL DEFAULT 'INDEFINI',
  `annee_parution` date NULL,
  `totalCopie` smallint UNSIGNED NOT NULL DEFAULT 1,
  `idAdmin` int UNSIGNED NOT NULL,
  `created_at` datetime NOT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idLivre`)
);

CREATE TABLE `Messages`  (
  `idMessages` int UNSIGNED NOT NULL DEFAULT 0,
  `idExp_Pers` int UNSIGNED NOT NULL,
  `idParent` int UNSIGNED NOT NULL,
  `objet` varchar(255) NOT NULL,
  `information` text NOT NULL,
  `type_message` smallint UNSIGNED NOT NULL DEFAULT 0 COMMENT '0 = individuel, 1= tous les parents , 2 = tous les parents pour paiement',
  `AnneeAcade` varchar(15) NOT NULL,
  `created_at` datetime NOT NULL ON UPDATE CURRENT_TIMESTAMP,
  `valider` tinyint(1) UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (`idMessages`)
);

CREATE TABLE `Mode`  (
  `idMode` int UNSIGNED NOT NULL,
  `libelle` varchar(100) NOT NULL DEFAULT 'INDEFINI',
  `information` tinytext CHARACTER SET utf8mb4 NOT NULL,
  `actif` tinyint(1) UNSIGNED NOT NULL DEFAULT 1,
  `idFondateur` int UNSIGNED NOT NULL,
  `created_at` datetime NOT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idMode`)
);

CREATE TABLE `NatureEpreuve`  (
  `idNature` int UNSIGNED NOT NULL,
  `libelle` varchar(255) NOT NULL DEFAULT 'INDEFINI' COMMENT 'Controle Continu, Examen, Devoir Mercredi, Devoir Week End',
  `description` tinytext CHARACTER SET utf8mb4 NULL,
  PRIMARY KEY (`idNature`)
);

CREATE TABLE `Paiement`  (
  `idPaie` int UNSIGNED NOT NULL,
  `matricule` int UNSIGNED NOT NULL,
  `idAca` int UNSIGNED NOT NULL,
  `montant` float NOT NULL,
  `url` varchar(255) NOT NULL DEFAULT 'INDEFINI',
  `comentaire` varchar(255) NOT NULL DEFAULT 'INDEFINI',
  `idMode` int UNSIGNED NOT NULL DEFAULT 1,
  `operation_ID` varchar(30) NOT NULL DEFAULT 'INDEFINI',
  `idPers` int UNSIGNED NOT NULL,
  `datePaie` date NOT NULL,
  `dateEnregistrer` datetime NOT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idPaie`)
);

CREATE TABLE `Parents`  (
  `idParent` int UNSIGNED NOT NULL,
  `idPers` int UNSIGNED NOT NULL,
  `matricule` int UNSIGNED NOT NULL,
  `idAdmin` int UNSIGNED NOT NULL,
  `created_at` datetime NOT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idParent`),
  UNIQUE INDEX `uniqueParent`(`idPers`, `matricule`) USING BTREE
);

CREATE TABLE `Personne`  (
  `idPers` int UNSIGNED NOT NULL,
  `nom` varchar(255) NOT NULL,
  `prenom` varchar(255) NOT NULL,
  `dateNaissance` date NOT NULL,
  `lieuNaissance` varchar(100) NOT NULL DEFAULT 'INDEFINI',
  `mobile` varchar(15) NOT NULL DEFAULT '000',
  `phone` varchar(15) NOT NULL DEFAULT '000',
  `typePersonne` smallint UNSIGNED NOT NULL COMMENT '1= Enseignant , 2 = Administratif, 3 = Scolarite, 4= parents, 5 = Autres',
  `username` varchar(100) NOT NULL,
  `password` varchar(100) NOT NULL,
  `alanyaID` varchar(15) NULL,
  `idAdmin` int UNSIGNED NOT NULL,
  `actif` tinyint(1) UNSIGNED NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idPers`)
);

CREATE TABLE `Quartier`  (
  `idQuartier` int UNSIGNED NOT NULL,
  `libelle` varchar(100) NOT NULL,
  `description` tinytext CHARACTER SET utf8mb4 NOT NULL,
  PRIMARY KEY (`idQuartier`)
);

CREATE TABLE `Rapport`  (
  `idRap` int UNSIGNED NOT NULL,
  `libelle` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
  `points` int UNSIGNED NOT NULL,
  `matricule` int UNSIGNED NOT NULL,
  `idAca` int UNSIGNED NOT NULL,
  `commentaire` text CHARACTER SET utf8mb4 NOT NULL,
  `event_date` date NOT NULL,
  `idPers` int UNSIGNED NOT NULL,
  `created_at` datetime NOT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idRap` DESC)
);

CREATE TABLE `Residents`  (
  `idResi` int UNSIGNED NOT NULL,
  `idPers` int UNSIGNED NOT NULL,
  `idQuartier` int UNSIGNED NOT NULL,
  `description` tinytext CHARACTER SET utf8mb4 NOT NULL,
  `idAdmin` int UNSIGNED NOT NULL,
  `created_at` datetime NOT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idResi`)
);

CREATE TABLE `Salle`  (
  `idSalle` int UNSIGNED NOT NULL,
  `libelle` varchar(30) NOT NULL,
  `position` varchar(100) NOT NULL DEFAULT 'NON DEFINI',
  `surface` varchar(30) NOT NULL,
  `idClasse` int UNSIGNED NOT NULL,
  `actif` tinyint(1) UNSIGNED NOT NULL DEFAULT 1,
  `idAdmin` int UNSIGNED NOT NULL,
  `created_at` datetime NOT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idSalle`)
);

CREATE TABLE `Scolarite`  (
  `idScolarite` int UNSIGNED NOT NULL,
  `inscription` float UNSIGNED NOT NULL,
  `pension` float UNSIGNED NOT NULL,
  `nbreTranche` smallint UNSIGNED NOT NULL DEFAULT 3,
  `description` tinytext CHARACTER SET utf8mb4 NOT NULL,
  `idCycle` int UNSIGNED NOT NULL,
  `idFondateur` int UNSIGNED NOT NULL,
  `created_at` datetime NOT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idScolarite`)
);

CREATE TABLE `Session`  (
  `idSession` int UNSIGNED NOT NULL,
  `libelle` varchar(255) NOT NULL,
  `description` tinytext CHARACTER SET utf8mb4 NULL,
  `idTrimestre` int UNSIGNED NOT NULL,
  `idPers` int UNSIGNED NOT NULL,
  `created_at` datetime NOT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idSession`)
);

CREATE TABLE `Specialite`  (
  `idSpecialite` int UNSIGNED NOT NULL,
  `libelle` varchar(255) NOT NULL,
  `idAdmin` int UNSIGNED NOT NULL,
  PRIMARY KEY (`idSpecialite`)
);

CREATE TABLE `Titulaire`  (
  `idTitulaire` int UNSIGNED NOT NULL,
  `idPers` int UNSIGNED NOT NULL,
  `idSalle` int UNSIGNED NOT NULL,
  `actif` tinyint(1) UNSIGNED NOT NULL DEFAULT 1,
  `idAdmin` int UNSIGNED NOT NULL,
  `created_at` datetime NOT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idTitulaire`)
);

CREATE TABLE `Tranches`  (
  `idTranche` int UNSIGNED NOT NULL,
  `libelle` varchar(255) NOT NULL,
  `montant` float UNSIGNED NOT NULL DEFAULT 0,
  `delai_mois` char(2) NOT NULL,
  `delai_jour` char(2) NOT NULL,
  `idScolarite` int UNSIGNED NOT NULL,
  `actif` tinyint(1) UNSIGNED NOT NULL DEFAULT 1,
  `idFondateur` int UNSIGNED NOT NULL,
  PRIMARY KEY (`idTranche`)
);

CREATE TABLE `Trimestre`  (
  `idTrimes` int UNSIGNED NOT NULL,
  `libelle` varchar(255) NOT NULL,
  `periode` varchar(255) NOT NULL,
  `idAca` int UNSIGNED NOT NULL,
  `idAdmin` int NOT NULL,
  PRIMARY KEY (`idTrimes`)
);

CREATE TABLE `VilleNaissance`  (
  `idVille` int UNSIGNED NOT NULL,
  `libelle` varchar(100) NOT NULL DEFAULT 'Autres',
  `actif` tinyint(1) UNSIGNED NOT NULL DEFAULT 1,
  PRIMARY KEY (`idVille`)
);

ALTER TABLE `Classe` ADD CONSTRAINT `associer` FOREIGN KEY (`idCycle`) REFERENCES `Cycle` (`idCycle`) ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE `Cours` ADD CONSTRAINT `lier` FOREIGN KEY (`idClasse`) REFERENCES `Classe` (`idClasse`) ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE `Eleve` ADD CONSTRAINT `lieuNaiss` FOREIGN KEY (`idVilleNaissance`) REFERENCES `VilleNaissance` (`idVille`) ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE `EmploiDuTemps` ADD CONSTRAINT `classes` FOREIGN KEY (`idClasse`) REFERENCES `Classe` (`idClasse`) ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE `EmploiDuTemps` ADD CONSTRAINT `cours` FOREIGN KEY (`idCours`) REFERENCES `Cours` (`idCours`) ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE `Enseignant` ADD CONSTRAINT `enseigner` FOREIGN KEY (`idCours`) REFERENCES `Cours` (`idCours`) ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE `Enseignant` ADD CONSTRAINT `enseignant` FOREIGN KEY (`idPers`) REFERENCES `Personne` (`idPers`) ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE `Epreuve` ADD CONSTRAINT `natu` FOREIGN KEY (`idNature`) REFERENCES `NatureEpreuve` (`idNature`) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE `Evaluation` ADD CONSTRAINT `matr` FOREIGN KEY (`matricule`) REFERENCES `Eleve` (`matricule`) ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE `Evaluation` ADD CONSTRAINT `epre` FOREIGN KEY (`idEpreuve`) REFERENCES `Epreuve` (`idEpreuve`) ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE `Evaluation` ADD CONSTRAINT `matiere` FOREIGN KEY (`idCours`) REFERENCES `Cours` (`idCours`) ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE `Evaluation` ADD CONSTRAINT `session` FOREIGN KEY (`idSession`) REFERENCES `Session` (`idSession`) ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE `Frequente` ADD CONSTRAINT `freq` FOREIGN KEY (`matricule`) REFERENCES `Eleve` (`matricule`) ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE `Frequente` ADD CONSTRAINT `lier_frequente_salle` FOREIGN KEY (`idSalle`) REFERENCES `Salle` (`idSalle`) ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE `Frequente` ADD CONSTRAINT `Acad` FOREIGN KEY (`idAcademi`) REFERENCES `AnneeAcademique` (`idAnnee`) ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE `Livres` ADD CONSTRAINT `special` FOREIGN KEY (`idSpecialite`) REFERENCES `Specialite` (`idSpecialite`) ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE `Messages` ADD CONSTRAINT `mess` FOREIGN KEY (`idParent`) REFERENCES `Parents` (`idParent`) ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE `Paiement` ADD CONSTRAINT `annee_paiement` FOREIGN KEY (`idAca`) REFERENCES `AnneeAcademique` (`idAnnee`) ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE `Paiement` ADD CONSTRAINT `enf` FOREIGN KEY (`matricule`) REFERENCES `Eleve` (`matricule`) ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE `Paiement` ADD CONSTRAINT `via` FOREIGN KEY (`idMode`) REFERENCES `Mode` (`idMode`) ON DELETE NO ACTION ON UPDATE CASCADE;
-- FIX: corrigé UNSIGNED
ALTER TABLE `Parents` ADD CONSTRAINT `enft` FOREIGN KEY (`matricule`) REFERENCES `Eleve` (`matricule`) ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE `Parents` ADD CONSTRAINT `parents` FOREIGN KEY (`idPers`) REFERENCES `Personne` (`idPers`) ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE `Rapport` ADD CONSTRAINT `enfant` FOREIGN KEY (`matricule`) REFERENCES `Eleve` (`matricule`) ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE `Rapport` ADD CONSTRAINT `annee_rapport` FOREIGN KEY (`idAca`) REFERENCES `AnneeAcademique` (`idAnnee`) ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE `Salle` ADD CONSTRAINT `lieu` FOREIGN KEY (`idClasse`) REFERENCES `Classe` (`idClasse`) ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE `Scolarite` ADD CONSTRAINT `argent` FOREIGN KEY (`idCycle`) REFERENCES `Cycle` (`idCycle`) ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE `Session` ADD CONSTRAINT `sessTrim` FOREIGN KEY (`idTrimestre`) REFERENCES `Trimestre` (`idTrimes`) ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE `Titulaire` ADD CONSTRAINT `responsable` FOREIGN KEY (`idSalle`) REFERENCES `Salle` (`idSalle`) ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE `Titulaire` ADD CONSTRAINT `nommer` FOREIGN KEY (`idPers`) REFERENCES `Personne` (`idPers`) ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE `Tranches` ADD CONSTRAINT `scol` FOREIGN KEY (`idScolarite`) REFERENCES `Scolarite` (`idScolarite`) ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE `Trimestre` ADD CONSTRAINT `anneTrim` FOREIGN KEY (`idAca`) REFERENCES `AnneeAcademique` (`idAnnee`) ON DELETE NO ACTION ON UPDATE CASCADE;

