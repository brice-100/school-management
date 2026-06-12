# Manuel Technique Complet - Plateforme de Gestion Scolaire

---

## 1. Introduction Générale

### 1.1 Contexte du Projet
Ce projet est une solution ERP (Enterprise Resource Planning) complète destinée à la gestion d'une école primaire ou secondaire. Le système vise à dématérialiser toutes les opérations administratives, pédagogiques et financières de l'établissement scolaire.

### 1.2 Objectif de l'Application
- **Centraliser** les informations des élèves, parents, et du personnel.
- **Simplifier** la gestion financière (paiement des scolarités, salaires des enseignants).
- **Faciliter** le suivi pédagogique (saisie des notes, génération des bulletins, emplois du temps).
- **Communiquer** efficacement via un système de notifications et de messagerie interne.

### 1.3 Public Cible et Acteurs
L'application dessert plusieurs profils avec des vues et des droits distincts :
- **Super Admin (Root) / Fondateur / Directeur** : Pilotage stratégique, accès complet à la finance, création du personnel, statistiques globales.
- **Administratif / Scolarité** : Gestion des inscriptions, des classes, des emplois du temps et de la discipline.
- **Enseignants** : Saisie des évaluations, suivi de leurs classes, gestion de leurs cours, consultation de leurs fiches de paie.
- **Parents d'élèves** : Consultation des notes de leurs enfants, suivi des paiements, réception de messages.

### 1.4 Glossaire
- **JWT (JSON Web Token)** : Jeton cryptographique utilisé pour l'authentification et les sessions.
- **MVC (Modèle-Vue-Contrôleur)** : Patron d'architecture séparant les données, l'interface et la logique.
- **MCD / MLD** : Modèle Conceptuel de Données / Modèle Logique de Données.
- **SPA (Single Page Application)** : Application web où l'interface est chargée une seule fois et mise à jour dynamiquement sans rechargement de page (React).

---

## 2. Accès à l'Application Déployée

Le projet a été pensé pour un déploiement cloud moderne, séparant le Frontend et le Backend pour plus de scalabilité.

### 2.1 Backend (API REST & Base de Données) - Hébergé sur Railway
- **Serveur de Base de données** : Instance MySQL hébergée sur Railway.
- **API Backend URL** : `https://projetbd-production.up.railway.app`
- **Documentation API (Swagger) en ligne** : [https://projetbd-production.up.railway.app/api-docs](https://projetbd-production.up.railway.app/api-docs)

### 2.2 Frontend (Interface Utilisateur) - Hébergé sur Vercel
Le client React est configuré pour un déploiement sur Vercel (tel que défini par le fichier `vercel.json`).
- **URL Frontend** : *Votre URL Vercel (ex: `https://mon-ecole.vercel.app`)*. 
- *Note : L'URL Vercel se connecte automatiquement à l'API Railway grâce à ses variables d'environnement.*

---

## 3. Architecture Technique

L'architecture est construite sur la stack **PERN** (sans PostgreSQL mais avec MySQL) : **MySQL, Express, React, Node.js**.

### 3.1 Stack Technologique
**Côté Serveur (Backend - `ProjetBD/`)**
- **Node.js & Express** : Routage et logique métier.
- **MySQL2** : Driver de base de données avec support des Promesses et Pool de connexions.
- **BcryptJS & JWT** : Sécurité et hachage.
- **Express-Validator** : Validation stricte des données entrantes.
- **Multer** : Gestion des uploads (photos de profil, justificatifs).

**Côté Client (Frontend - `client/`)**
- **React 19 & Vite** : Rendu UI ultra-rapide et build optimisé.
- **Tailwind CSS v4 & Lucide React** : Design system moderne et responsive.
- **React Hook Form & Zod** : Gestion et validation des formulaires.
- **Axios** : Client HTTP configuré avec intercepteurs pour injecter le token JWT.
- **Recharts** : Visualisation des données (Dashboard).

### 3.2 Schéma d'Architecture Global

```mermaid
graph TD
    subgraph Frontend [Vercel - Client React]
        UI[Interface Utilisateur]
        State[React Context / Hooks]
        HTTPClient[Axios Interceptors]
    end

    subgraph Backend [Railway - Node.js Express]
        Router[Express Routes]
        AuthMW[Auth Middleware JWT]
        Controller[Controllers]
        Model[Models SQL]
        Uploads[Local File System]
    end

    subgraph Database [Railway - MySQL]
        SQL[(Base de données MySQL)]
    end

    UI --> State
    State --> HTTPClient
    HTTPClient -- "Requêtes HTTPS (JSON/FormData)" --> Router
    Router --> AuthMW
    AuthMW -- "Validation Token" --> Controller
    Controller --> Model
    Controller -- "Fichiers" --> Uploads
    Model -- "Requêtes SQL" --> SQL
```

---

## 4. Base de Données

Le modèle de données est hautement relationnel. Le système gère les notions complexes telles que la pérennité des données d'une année sur l'autre (concept d'Année Académique).

### 4.1 Modèle Conceptuel de Données (MCD)

```mermaid
erDiagram
    PERSONNE ||--o{ ENSEIGNANT : est
    PERSONNE ||--o{ PARENTS : est
    ELEVE ||--o{ PARENTS : "a pour parent"
    ELEVE ||--o{ FREQUENTE : "est inscrit dans"
    ELEVE ||--o{ EVALUATION : "recoit (note)"
    ELEVE ||--o{ PAIEMENT : effectue
    CLASSE ||--o{ SALLE : contient
    COURS }|--|| CLASSE : appartient_a
    ENSEIGNANT }|--o{ COURS : enseigne_principalement
    ENSEIGNANT }|--o{ TEACHER_MATIERES : enseigne_secondairement
    SESSION ||--|{ EVALUATION : possede
    TRIMESTRE ||--|{ SESSION : divise
    ANNEE_ACADEMIQUE ||--o{ TRIMESTRE : "contient"
    ANNEE_ACADEMIQUE ||--o{ FREQUENTE : "definit annee scolaire"
```

### 4.2 Dictionnaire des Données Principal (MLD)

| Table | Champs Clés | Description |
|---|---|---|
| **Personne** | `idPers`, `nom`, `password`, `typePersonne` | Table mère pour tous les employés et parents. `typePersonne` définit le rôle (1=Enseignant, 4=Parent, etc.). |
| **Eleve** | `matricule` (VARCHAR), `nom`, `dateNaissance`, `actif` | Contient les données d'état civil des élèves. La suppression est logique (`actif=0`). |
| **Classe** / **Salle** | `idClasse`, `idCycle`, `libelle` | Structure physique et hiérarchique de l'école. |
| **Cours** | `idCours`, `libelle`, `coefficient`, `idClasse` | Matières enseignées. |
| **teacher_matieres** | `teacher_id`, `matiere_id` | Table de liaison (N:M) permettant à un enseignant d'enseigner plusieurs matières dans différentes classes. |
| **AnneeAcademique** | `idAnnee`, `libelle`, `est_active` | Gère les années scolaires (ex: 2023-2024). L'application filtre dynamiquement les données selon l'année active. |
| **Frequente** | `idFrequente`, `matricule`, `idSalle`, `idAcademi` | Historise dans quelle salle se trouvait un élève pour une année donnée (Inscription). |
| **Evaluation** | `idEval`, `note`, `matricule`, `idCours` | Notes obtenues par les élèves. |
| **Paiement** | `idPaiement`, `montant`, `valide`, `idAca` | Historique des paiements de scolarité, rattachés à une année académique. |

---

## 5. Installation et Configuration Locales

Pour les développeurs souhaitant modifier le code localement :

### 5.1 Prérequis
- Node.js (v18+)
- MySQL (v8.0+) (XAMPP/WAMP ou Docker)

### 5.2 Configuration du Backend
1. **Naviguer** : `cd ProjetBD`
2. **Installer** : `npm install`
3. **Variables d'environnement** : Créer un fichier `.env` :
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=votre_mot_de_passe
   DB_NAME=school_db
   DB_PORT=3306
   JWT_SECRET=super_secret_jwt_key
   JWT_EXPIRES_IN=7d
   NODE_ENV=development
   ```
4. **Base de données** : 
   Importez la structure de base puis migrez :
   ```bash
   mysql -u root -p school_db < Alanya_13Avril_MySQL.sql
   npm run db:migrate # Applique les modifications Railway (ex: matricule en VARCHAR)
   ```
5. **Démarrer** : `npm run dev` (API disponible sur `http://localhost:5000`)

### 5.3 Configuration du Frontend
1. **Naviguer** : `cd client`
2. **Installer** : `npm install`
3. **Variables d'environnement** (`.env`) :
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```
4. **Démarrer** : `npm run dev` (App disponible sur `http://localhost:5173`)

---

## 6. Description Fonctionnelle des Modules

### 6.1 Module d'Authentification
- Basé sur un JWT stocké de manière sécurisée côté client.
- Gère la distinction entre les Administrateurs (table `Admin`) et le reste du monde (table `Personne` : Enseignants, Parents).

### 6.2 Module Pédagogique (Scolarité)
- **Gestion des Élèves** : Génération de matricules, assignation dans des classes (via `Frequente`), génération de fiches complètes (notes, absences, paiements regroupés).
- **Évaluations et Bulletins** : Saisie des notes par cours et session. Calcul automatique des moyennes générales, taux de réussite, et génération de bulletins.
- **Emplois du temps** : Grille horaire liant un Jour, une Heure, une Classe, une Matière, une Salle et un Enseignant.

### 6.3 Module Financier
- **Paiements des Frais de Scolarité** : Le parent peut initier un paiement (MoMo, Orange Money, Cash). L'administrateur doit ensuite **valider** ce paiement. Les statistiques de recouvrement sont calculées dynamiquement dans le Dashboard.
- **Salaires Enseignants** : Génération de "Fiches" de paie selon les heures ou montants fixes, avec suivi de l'état (Payé / Non Payé).

### 6.4 Gestion du Contexte Annuel (Important)
Le système gère l'historique de l'école.
- **Le Middleware `anneeMiddleware.js`** : Intercepte les requêtes pour injecter `req.query.idAnnee`. 
- Si l'utilisateur Frontend change l'année dans le menu déroulant, toute l'application (Dashboard, Élèves, Notes) se recharge pour n'afficher **que les données de l'année sélectionnée**, évitant ainsi la pollution des données inter-années.

---

## 7. Sécurité, Rôles et Habilitations

### 7.1 Matrice des Rôles (RBAC)
Le middleware `roleMiddleware.js` gère la vérification granulaire des droits :
- `allowAdmin(0, 1)` : Autorise uniquement Root et Admin. Utilisé pour la suppression définitive d'entités, configuration système.
- `allowPersonne(1)` : Autorise uniquement les Enseignants. Utilisé pour la saisie de leurs notes et consultation de leurs emplois du temps.
- `allowAny({ admins: [0,1,2,3], personnes: [1,3] })` : Règles combinées (ex: Voir la liste des élèves est permis aux directeurs, admins, enseignants et service scolarité).

### 7.2 Sécurité des Données
- **Hachage** : Les mots de passe sont salés et hachés avec `bcryptjs`.
- **Injections SQL** : Le pilote `mysql2` utilise systématiquement des requêtes préparées (`pool.query('SELECT * FROM Users WHERE id = ?', [id])`) bloquant nativement les injections SQL.
- **CORS** : Le Backend restreint les requêtes entrantes aux domaines autorisés (localhost, .vercel.app) via le module `cors`.

---

## 8. API / Documentation Interfaces

L'API REST comprend plus de 100 endpoints. Elle est documentée interactivement via **Swagger UI**.

- **URL d'accès** : `/api-docs` (ex: `http://localhost:5000/api-docs`).
- **Fonctionnement** : Il est nécessaire de s'authentifier via l'interface Swagger (bouton "Authorize") en y collant le token JWT obtenu via la route `/auth/login` pour tester les routes sécurisées.

---

## 9. Maintenance et Dépannage

### 9.1 Scripts de Migration (`migrate_railway.js`)
Étant donné que la DB est sur Railway, nous ne faisons pas de requêtes destructives (`DROP TABLE`).
Pour ajouter de nouvelles colonnes, il faut éditer la fonction `main()` dans `migrate_railway.js` en utilisant `addColIfMissing()`.
**Commande de déploiement manuel de la DB :**
```bash
node migrate_railway.js --url "mysql://utilisateur:mdp@hote:port/database"
```

### 9.2 Gestion des Erreurs Courantes
- **Erreur 502 Bad Gateway (Railway)** : Se produit généralement si le backend crash au démarrage (ex: port incorrect, variable d'environnement manquante, ou erreur de connexion à MySQL).
- **CORS Error (Frontend)** : Si l'URL Vercel change, il faut s'assurer qu'elle termine par `.vercel.app` ou mettre à jour la variable `CLIENT_URL` côté backend Railway.
- **Données invisibles** : Vérifier que l'année académique "Active" est bien configurée (`est_active = 1` dans la table `AnneeAcademique`). Un `idAnnee` manquant peut masquer les élèves ou statistiques.

### 9.3 Sauvegardes
Railway effectue des backups automatiques. Toutefois, un dump SQL manuel régulier est conseillé pour l'archivage via la commande :
```bash
mysqldump -u [user] -p -h [host] [dbname] > backup.sql
```

---
*Fin du document technique.*
