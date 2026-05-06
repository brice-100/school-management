CREATE TABLE `default`.`Admin`  (
  `ID` int UNSIGNED NOT NULL,
  `nom` varchar(100) NOT NULL DEFAULT 'root',
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `actif` tinyint(1) UNSIGNED NOT NULL DEFAULT 1,
  `typeAdmin` smallint UNSIGNED NOT NULL COMMENT '0 = root, 1 = Admin, 2 = Fondateur , 3 = Directeur',
  `mobile` varchar(15) NOT NULL,
  `alanyaID` varchar(15) NOT NULL,
  `created_at` datetime NOT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`ID`)
);

CREATE TABLE `default`.`AnneeAcademique`  (
  `idAnnee` int UNSIGNED NOT NULL,
  `libelle` varchar(200) NOT NULL,
  `periode` varchar(255) NOT NULL,
  `created_at` date NOT NULL,
  `idAdmin` int UNSIGNED NOT NULL,
  PRIMARY KEY (`idAnnee`)
);

CREATE TABLE `default`.`Classe`  (
  `idClasse` int UNSIGNED NOT NULL,
  `libelle` varchar(100) NOT NULL DEFAULT 'INDEFINI',
  `idCycle` int UNSIGNED NOT NULL,
  `idAdmin` int UNSIGNED NOT NULL,
  `created_at` datetime NOT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idClasse`)
);

CREATE TABLE `default`.`Cours`  (
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

CREATE TABLE `default`.`Cycle`  (
  `idCycle` int UNSIGNED NOT NULL,
  `libelle` varchar(255) NOT NULL,
  `description` tinytext CHARACTER SET utf8mb4 NOT NULL,
  `idAdmin` int UNSIGNED NOT NULL,
  `created` datetime NOT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idCycle`)
);

CREATE TABLE `default`.`Discipline`  (
  `ID` int UNSIGNED NOT NULL,
  `libelle` varchar(255) CHARACTER SET utf8mb4 NOT NULL,
  `points` int UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (`ID` DESC)
);

CREATE TABLE `default`.`Eleve`  (
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

CREATE TABLE `default`.`EmploiDuTemps`  (
  `idTemps` int UNSIGNED NOT NULL,
  `jour` varchar(30) NOT NULL,
  `heure` varchar(6) NOT NULL,
  `idClasse` int UNSIGNED NOT NULL,
  `idCours` int UNSIGNED NOT NULL,
  `idAdmin` int UNSIGNED NOT NULL,
  `created_at` datetime NOT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idTemps`)
);

CREATE TABLE `default`.`Enseignant`  (
  `idEnseignant` int UNSIGNED NOT NULL,
  `idPers` int UNSIGNED NOT NULL,
  `idCours` int UNSIGNED NOT NULL,
  `Actif` tinyint(1) UNSIGNED NOT NULL DEFAULT 1,
  `idAdmin` int UNSIGNED NOT NULL,
  `created_at` datetime NOT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idEnseignant`)
);

CREATE TABLE `default`.`Epreuve`  (
  `idEpreuve` int UNSIGNED NOT NULL,
  `libelle` varchar(255) NOT NULL,
  `urlDoc` varchar(255) NOT NULL DEFAULT 'INDEFINI',
  `auteur` varchar(255) NOT NULL DEFAULT 'INDEFINI',
  `idNature` int UNSIGNED NOT NULL,
  `idPers` int UNSIGNED NOT NULL,
  `created_at` datetime NOT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idEpreuve`)
);

CREATE TABLE `default`.`Evaluation`  (
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

CREATE TABLE `default`.`FicheEnseignant`  (
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

CREATE TABLE `default`.`Frequente`  (
  `idFrequente` int UNSIGNED NOT NULL,
  `idSalle` int UNSIGNED NOT NULL,
  `idAcademi` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `matricule` int UNSIGNED NOT NULL,
  `commentaire` varchar(255) NOT NULL DEFAULT RAS,
  `idAdmin` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idFrequente`)
);

CREATE TABLE `default`.`JourSemaine`  (
  `ID` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `libelle` varchar(15) NOT NULL,
  PRIMARY KEY (`ID`)
);

CREATE TABLE `default`.`Justificatifs`  (
  `ID` int UNSIGNED NOT NULL,
  `idRapport` int UNSIGNED NOT NULL,
  `commentaire` text CHARACTER SET utf8mb4 NOT NULL,
  `idDirecteur` int UNSIGNED NULL,
  `urlDoc` varchar(255) NULL,
  `created_at` datetime NOT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`ID`)
);

CREATE TABLE `default`.`Livres`  (
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

CREATE TABLE `default`.`Messages`  (
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

CREATE TABLE `default`.`Mode`  (
  `idMode` int UNSIGNED NOT NULL,
  `libelle` varchar(100) NOT NULL DEFAULT 'INDEFINI',
  `information` tinytext CHARACTER SET utf8mb4 NOT NULL,
  `actif` tinyint(1) UNSIGNED NOT NULL DEFAULT 1,
  `idFondateur` int UNSIGNED NOT NULL,
  `created_at` datetime NOT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idMode`)
);

CREATE TABLE `default`.`NatureEpreuve`  (
  `idNature` int UNSIGNED NOT NULL,
  `libelle` varchar(255) NOT NULL DEFAULT 'INDEFINI' COMMENT 'Controle Continu, Examen, Devoir Mercredi, Devoir Week End',
  `description` tinytext CHARACTER SET utf8mb4 NULL,
  PRIMARY KEY (`idNature`)
);

CREATE TABLE `default`.`Paiement`  (
  `idPaie` int UNSIGNED NOT NULL,
  `matricule` int UNSIGNED NOT NULL,
  `idAca` int UNSIGNED NOT NULL,
  `montant` float NOT NULL,
  `url` varchar(255) NOT NULL DEFAULT 'INDEFINI',
  `comentaire` varchar(255) NOT NULL DEFAULT 'INDEFINI',
  `idMode` int UNSIGNED NOT NULL DEFAULT 'Especes',
  `operation_ID` varchar(30) NOT NULL DEFAULT 'INDEFINI',
  `idPers` int UNSIGNED NOT NULL,
  `datePaie` date NOT NULL,
  `dateEnregistrer` datetime NOT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idPaie`)
);

CREATE TABLE `default`.`Parents`  (
  `idParent` int UNSIGNED NOT NULL,
  `idPers` int UNSIGNED NOT NULL,
  `matricule` int NOT NULL,
  `idAdmin` int UNSIGNED NOT NULL,
  `created_at` datetime NOT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idParent`),
  UNIQUE INDEX `uniqueParent`(`idPers`, `matricule`) USING BTREE
);

CREATE TABLE `default`.`Personne`  (
  `idPers` int UNSIGNED NOT NULL,
  `nom` varchar(255) NOT NULL,
  `prenom` varchar(255) NOT NULL,
  `dateNaissance` date NOT NULL,
  `lieuNaissance` varchar(100) NOT NULL DEFAULT 'INDEFINI',
  `mobile` varchar(15) NOT NULL DEFAULT 000,
  `phone` varchar(15) NOT NULL DEFAULT 000,
  `typePersonne` smallint UNSIGNED NOT NULL COMMENT '1= Enseignant , 2 = Administratif, 3 = Scolarite, 4= parents, 5 = Autres',
  `username` varchar(100) NOT NULL,
  `password` varchar(100) NOT NULL,
  `alanyaID` varchar(15) NULL,
  `idAdmin` int UNSIGNED NOT NULL,
  `created_at` datetime NOT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idPers`)
);

CREATE TABLE `default`.`Quartier`  (
  `idQuartier` int UNSIGNED NOT NULL,
  `libelle` varchar(100) NOT NULL,
  `description` tinytext CHARACTER SET utf8mb4 NOT NULL,
  PRIMARY KEY (`idQuartier`)
);

CREATE TABLE `default`.`Rapport`  (
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

CREATE TABLE `default`.`Residents`  (
  `idResi` int UNSIGNED NOT NULL,
  `idPers` int UNSIGNED NOT NULL,
  `idQuartier` int UNSIGNED NOT NULL,
  `description` tinytext CHARACTER SET utf8mb4 NOT NULL,
  `idAdmin` int UNSIGNED NOT NULL,
  `created_at` datetime NOT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idResi`)
);

CREATE TABLE `default`.`Salle`  (
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

CREATE TABLE `default`.`Scolarite`  (
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

CREATE TABLE `default`.`Session`  (
  `idSession` int UNSIGNED NOT NULL,
  `libelle` varchar(255) NOT NULL,
  `description` tinytext CHARACTER SET utf8mb4 NULL,
  `idTrimestre` int UNSIGNED NOT NULL,
  `idPers` int UNSIGNED NOT NULL,
  `created_at` datetime NOT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idSession`)
);

CREATE TABLE `default`.`Specialite`  (
  `idSpecialite` int UNSIGNED NOT NULL,
  `libelle` varchar(255) NOT NULL,
  `idAdmin` int UNSIGNED NOT NULL,
  PRIMARY KEY (`idSpecialite`)
);

CREATE TABLE `default`.`Titulaire`  (
  `idTitulaire` int UNSIGNED NOT NULL,
  `idPers` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `idSalle` int UNSIGNED NOT NULL,
  `actif` tinyint(1) UNSIGNED NOT NULL DEFAULT 1,
  `idAdmin` int UNSIGNED NOT NULL,
  `created_at` datetime NOT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idTitulaire`)
);

CREATE TABLE `default`.`Tranches`  (
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

CREATE TABLE `default`.`Trimestre`  (
  `idTrimes` int UNSIGNED NOT NULL,
  `libelle` varchar(255) NOT NULL,
  `periode` varchar(255) NOT NULL,
  `idAca` int UNSIGNED NOT NULL,
  `idAdmin` int NOT NULL,
  PRIMARY KEY (`idTrimes`)
);

CREATE TABLE `default`.`VilleNaissance`  (
  `idVille` int UNSIGNED NOT NULL,
  `libelle` varchar(100) NOT NULL DEFAULT 'Autres',
  `actif` tinyint(1) UNSIGNED NOT NULL DEFAULT 1,
  PRIMARY KEY (`idVille`)
);

ALTER TABLE `default`.`Classe` ADD CONSTRAINT `associer` FOREIGN KEY (`idCycle`) REFERENCES `default`.`Cycle` (`idCycle`) ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE `default`.`Cours` ADD CONSTRAINT `lier` FOREIGN KEY (`idClasse`) REFERENCES `default`.`Classe` (`idClasse`) ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE `default`.`Eleve` ADD CONSTRAINT `lieuNaiss` FOREIGN KEY (`idVilleNaissance`) REFERENCES `default`.`VilleNaissance` (`idVille`) ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE `default`.`EmploiDuTemps` ADD CONSTRAINT `classes` FOREIGN KEY (`idClasse`) REFERENCES `default`.`Classe` (`idClasse`) ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE `default`.`EmploiDuTemps` ADD CONSTRAINT `cours` FOREIGN KEY (`idCours`) REFERENCES `default`.`Cours` (`idCours`) ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE `default`.`Enseignant` ADD CONSTRAINT `enseigner` FOREIGN KEY (`idCours`) REFERENCES `default`.`Cours` (`idCours`) ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE `default`.`Enseignant` ADD CONSTRAINT `enseignant` FOREIGN KEY (`idPers`) REFERENCES `default`.`Personne` (`idPers`) ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE `default`.`Epreuve` ADD CONSTRAINT `natu` FOREIGN KEY (`idNature`) REFERENCES `default`.`NatureEpreuve` (`idNature`) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE `default`.`Evaluation` ADD CONSTRAINT `matr` FOREIGN KEY (`matricule`) REFERENCES `default`.`Eleve` (`matricule`) ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE `default`.`Evaluation` ADD CONSTRAINT `epre` FOREIGN KEY (`idEpreuve`) REFERENCES `default`.`Epreuve` (`idEpreuve`) ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE `default`.`Evaluation` ADD CONSTRAINT `matiere` FOREIGN KEY (`idCours`) REFERENCES `default`.`Cours` (`idCours`) ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE `default`.`Evaluation` ADD CONSTRAINT `session` FOREIGN KEY (`idSession`) REFERENCES `default`.`Session` (`idSession`) ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE `default`.`Frequente` ADD CONSTRAINT `freq` FOREIGN KEY (`matricule`) REFERENCES `default`.`Eleve` (`matricule`) ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE `default`.`Frequente` ADD CONSTRAINT `lier` FOREIGN KEY (`idSalle`) REFERENCES `default`.`Salle` (`idSalle`) ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE `default`.`Frequente` ADD CONSTRAINT `Acad` FOREIGN KEY (`idAcademi`) REFERENCES `default`.`AnneeAcademique` (`idAnnee`) ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE `default`.`Livres` ADD CONSTRAINT `special` FOREIGN KEY (`idSpecialite`) REFERENCES `default`.`Specialite` (`idSpecialite`) ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE `default`.`Messages` ADD CONSTRAINT `mess` FOREIGN KEY (`idParent`) REFERENCES `default`.`Parents` (`idParent`) ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE `default`.`Paiement` ADD CONSTRAINT `annee` FOREIGN KEY (`idAca`) REFERENCES `default`.`AnneeAcademique` (`idAnnee`) ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE `default`.`Paiement` ADD CONSTRAINT `enf` FOREIGN KEY (`matricule`) REFERENCES `default`.`Eleve` (`matricule`) ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE `default`.`Paiement` ADD CONSTRAINT `via` FOREIGN KEY (`idMode`) REFERENCES `default`.`Mode` (`idMode`) ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE `default`.`Parents` ADD CONSTRAINT `enft` FOREIGN KEY (`matricule`) REFERENCES `default`.`Eleve` (`matricule`) ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE `default`.`Parents` ADD CONSTRAINT `parents` FOREIGN KEY (`idPers`) REFERENCES `default`.`Personne` (`idPers`) ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE `default`.`Rapport` ADD CONSTRAINT `enfant` FOREIGN KEY (`matricule`) REFERENCES `default`.`Eleve` (`matricule`) ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE `default`.`Rapport` ADD CONSTRAINT `annee` FOREIGN KEY (`idAca`) REFERENCES `default`.`AnneeAcademique` (`idAnnee`) ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE `default`.`Residents` ADD CONSTRAINT `zone` FOREIGN KEY (`idQuartier`) REFERENCES `default`.`Quartier` (`idQuartier`) ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE `default`.`Residents` ADD CONSTRAINT `habite` FOREIGN KEY (`idPers`) REFERENCES `default`.`Personne` (`idPers`) ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE `default`.`Salle` ADD CONSTRAINT `lieu` FOREIGN KEY (`idClasse`) REFERENCES `default`.`Classe` (`idClasse`) ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE `default`.`Scolarite` ADD CONSTRAINT `argent` FOREIGN KEY (`idCycle`) REFERENCES `default`.`Cycle` (`idCycle`) ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE `default`.`Session` ADD CONSTRAINT `sessTrim` FOREIGN KEY (`idTrimestre`) REFERENCES `default`.`Trimestre` (`idTrimes`) ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE `default`.`Titulaire` ADD CONSTRAINT `responsable` FOREIGN KEY (`idSalle`) REFERENCES `default`.`Salle` (`idSalle`) ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE `default`.`Titulaire` ADD CONSTRAINT `nommer` FOREIGN KEY (`idPers`) REFERENCES `default`.`Personne` (`idPers`) ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE `default`.`Tranches` ADD CONSTRAINT `scol` FOREIGN KEY (`idScolarite`) REFERENCES `default`.`Scolarite` (`idScolarite`) ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE `default`.`Trimestre` ADD CONSTRAINT `anneTrim` FOREIGN KEY (`idAca`) REFERENCES `default`.`AnneeAcademique` (`idAnnee`) ON DELETE NO ACTION ON UPDATE CASCADE;

