# ecoleManager — API Backend

Une API REST robuste et performante pour la gestion administrative, pédagogique et financière d'une école primaire. Conçue avec Node.js, Express et MySQL, elle gère de manière sécurisée les élèves, les enseignants, les parents, les planifications de cours, la facturation des scolarités et les paiements mobiles via l'intégration CinetPay.

---

## 🛠️ Stack technique

* **Runtime :** Node.js (>= 18)
* **Framework :** Express
* **Base de données :** MySQL (>= 8)
* **Sécurité & Authentification :** JSON Web Tokens (JWT), bcryptjs
* **Upload de fichiers :** Multer (stockage local des photos de profils et justificatifs)
* **Planification de tâches :** node-cron (tâches automatisées en arrière-plan)
* **Configuration :** dotenv

---

## 📋 Prérequis

* **Node.js** >= 18.x
* **npm** >= 9.x
* **MySQL** >= 8.x (avec un utilisateur disposant des privilèges de création de bases de données et de tables)

---

## 🚀 Installation et Démarrage

1. **Cloner le projet & naviguer vers le dossier backend :**
   ```bash
   git clone https://github.com/[À_COMPLÉTER]/ecoleManager.git
   cd ecoleManager/ProjetBD
   ```

2. **Installer les dépendances :**
   ```bash
   npm install
   ```

3. **Configurer les variables d'environnement :**
   Copiez le fichier d'exemple et remplissez-le avec vos propres paramètres de connexion et clés API :
   ```bash
   cp .env.example .env
   ```

4. **Initialiser la base de données :**
   * Créez une base de données dans votre instance MySQL (ex: `school_db`).
   * Importez le schéma SQL (`schema.sql` ou fichier d'importation fourni) contenant la structure des tables et les données initiales requises :
     ```bash
     mysql -u root -p school_db < [À_COMPLÉTER_OU_schema.sql]
     ```

5. **Lancer le serveur de développement (avec rechargement automatique) :**
   ```bash
   npm run dev
   ```
   Le serveur démarrera par défaut sur le port `5000` (adresse : `http://localhost:5000`).

---

## 🔑 Variables d'environnement (`.env`)

| Variable | Description | Exemple |
| :--- | :--- | :--- |
| `PORT` | Port d'écoute du serveur Express | `5000` |
| `DB_HOST` | Hôte du serveur de base de données MySQL | `localhost` |
| `DB_PORT` | Port du serveur de base de données MySQL | `3306` |
| `DB_USER` | Utilisateur de la base de données MySQL | `root` |
| `DB_PASSWORD` | Mot de passe de l'utilisateur MySQL | `votre_mot_de_passe` |
| `DB_NAME` | Nom de la base de données de l'application | `school_db` |
| `JWT_SECRET` | Clé secrète utilisée pour signer et vérifier les tokens JWT | `super_secret_cle_jwt_2026` |
| `JWT_EXPIRES_IN` | Durée de validité des jetons d'authentification | `24h` |
| `FRONTEND_URL` | URL de l'application cliente autorisée par les CORS | `http://localhost:5173` |
| `CINETPAY_APIKEY` | Clé d'API fournie par le portail marchand CinetPay | `[À_COMPLÉTER]` |
| `CINETPAY_SITE_ID` | Identifiant du site web marchand fourni par CinetPay | `[À_COMPLÉTER]` |

---

## 📂 Structure du projet

L'architecture suit le motif classique **MVC (Model-View-Controller)** adapté aux API REST :

```text
ProjetBD/
├── src/
│   ├── config/          # Configurations globales (Connexion DB MySQL via Pool, etc.)
│   ├── controllers/     # Logique métier et orchestration des requêtes/réponses HTTP
│   ├── middleware/      # Middlewares (Authentification, gestion des rôles, upload, gestion de l'année scolaire)
│   ├── models/          # Requêtes SQL directes et interactions avec la base de données
│   ├── routes/          # Déclaration et routage des endpoints HTTP
│   ├── utils/           # Fonctions utilitaires et wrappers (ex: asyncHandler)
│   ├── index.js         # Point d'entrée de l'application Express
└── package.json
```

---

## 📡 Endpoints API

Toutes les routes sont préfixées par `/api`.

### 🔐 Authentification & Comptes
| Méthode | Route | Description | Auth requise | Rôles autorisés |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/auth/login` | Connexion utilisateur (génère un token JWT) | Non | Tous |
| `POST` | `/auth/register` | Création d'un compte (Admin / Enseignant) | Oui | Admin |
| `POST` | `/auth/register/parent` | Inscription publique d'un parent d'élève | Non | Tous |
| `POST` | `/auth/change-password` | Modification du mot de passe de l'utilisateur connecté | Oui | Tous |

### 🧑‍🎓 Gestion des Élèves
| Méthode | Route | Description | Auth requise | Rôles autorisés |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/students` | Liste tous les élèves actifs / archivés | Oui | Admin, Enseignant |
| `GET` | `/students/:id` | Détails complets d'un élève (matricule) | Oui | Admin, Enseignant, Parent |
| `POST` | `/students` | Enregistrer un nouvel élève (avec photo `multipart/form-data`) | Oui | Admin |
| `PUT` | `/students/:id` | Modifier les informations d'un élève (avec photo) | Oui | Admin |
| `DELETE` | `/students/:id` | Suppression logique d'un élève (archivage) | Oui | Admin |
| `PATCH` | `/students/:id/restaurer` | Restaurer un élève archivé | Oui | Admin |

### 👩‍🏫 Gestion des Enseignants
| Méthode | Route | Description | Auth requise | Rôles autorisés |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/teachers` | Liste tous les enseignants | Oui | Admin |
| `GET` | `/teachers/:id` | Détails d'un enseignant spécifique | Oui | Admin |
| `POST` | `/teachers` | Créer un profil enseignant (photo facultative) | Oui | Admin |
| `PUT` | `/teachers/:id` | Modifier un enseignant | Oui | Admin |
| `DELETE` | `/teachers/:id` | Archivage d'un enseignant | Oui | Admin |
| `PATCH` | `/teachers/:id/restaurer` | Restaurer un enseignant archivé | Oui | Admin |
| `GET` | `/teachers/:id/eleves` | Liste des élèves associés aux classes de l'enseignant | Oui | Enseignant, Admin |

### 👪 Gestion des Parents
| Méthode | Route | Description | Auth requise | Rôles autorisés |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/parents` | Liste tous les parents d'élèves | Oui | Admin |
| `GET` | `/parents/mes-enfants` | Liste les enfants associés au parent connecté | Oui | Parent |
| `GET` | `/parents/:id` | Détails d'un parent spécifique | Oui | Admin |
| `POST` | `/parents` | Créer un profil parent (liaison élève par matricule) | Oui | Admin |
| `PUT` | `/parents/:id` | Modifier un parent d'élève | Oui | Admin |
| `DELETE` | `/parents/:id` | Archivage logique d'un parent | Oui | Admin |
| `PATCH` | `/parents/:id/restaurer` | Restaurer un parent archivé | Oui | Admin |
| `DELETE` | `/parents/:id/hard` | Suppression définitive (physique) d'un parent | Oui | Admin |

### 🏫 Classes, Salles & Cours
| Méthode | Route | Description | Auth requise | Rôles autorisés |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/classes` | Liste des classes de l'établissement | Oui | Admin, Enseignant |
| `POST` | `/classes` | Créer une nouvelle classe | Oui | Admin |
| `GET` | `/cours` | Liste des cours / matières | Oui | Admin, Enseignant |
| `POST` | `/cours` | Créer une nouvelle matière académique | Oui | Admin |

### 📝 Évaluations & Notes
| Méthode | Route | Description | Auth requise | Rôles autorisés |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/evaluations` | Liste des épreuves et évaluations programmées | Oui | Admin, Enseignant |
| `POST` | `/evaluations` | Planifier une nouvelle évaluation (devoirs, examens) | Oui | Admin, Enseignant |
| `GET` | `/grades` | Liste de toutes les notes saisies | Oui | Admin, Enseignant |
| `POST` | `/grades` | Enregistrer des notes pour les élèves d'une classe | Oui | Admin, Enseignant |
| `PUT` | `/grades/:id` | Corriger la note d'un élève | Oui | Admin, Enseignant |

### 📊 Bulletins de Notes
| Méthode | Route | Description | Auth requise | Rôles autorisés |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/bulletins` | Liste des bulletins trimestriels générés | Oui | Admin, Enseignant, Parent |
| `GET` | `/bulletins/eleve/:matricule` | Générer / Consulter le bulletin d'un élève | Oui | Admin, Enseignant, Parent |

### 💳 Paiements & Scolarité (Finances)
| Méthode | Route | Description | Auth requise | Rôles autorisés |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/paiements` | Historique global des paiements de scolarité | Oui | Admin |
| `POST` | `/paiements` | Enregistrer un paiement physique (espèces, chèque) | Oui | Admin |
| `GET` | `/paiements/mon-compte` | Historique des paiements liés au parent connecté | Oui | Parent |
| `POST` | `/paiements/initier` | Initier un paiement mobile en ligne (CinetPay) | Oui | Parent |
| `POST` | `/paiements/notify` | Webhook de notification CinetPay (CORS ouverts) | Non | Tous (Externe) |

### 💰 Salaires
| Méthode | Route | Description | Auth requise | Rôles autorisés |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/salaires` | Liste des paiements de salaires des enseignants | Oui | Admin |
| `POST` | `/salaires` | Enregistrer le versement d'un salaire | Oui | Admin |
| `GET` | `/salaires/mon-salaire` | Consulter ses propres fiches de paie | Oui | Enseignant |

### 📅 Emploi du Temps (Planning)
| Méthode | Route | Description | Auth requise | Rôles autorisés |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/planning` | Récupérer la grille complète de l'emploi du temps | Oui | Admin, Enseignant, Parent |
| `POST` | `/planning` | Ajouter un créneau horaire de cours | Oui | Admin |
| `DELETE` | `/planning/:id` | Archiver (suppression logique) d'un créneau | Oui | Admin |
| `PATCH` | `/planning/:id/restaurer` | Restaurer un créneau archivé | Oui | Admin |

### 💬 Messagerie Administrative & Interne
| Méthode | Route | Description | Auth requise | Rôles autorisés |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/messages` | Charger les messages généraux envoyés aux parents | Oui | Admin, Parent |
| `POST` | `/messages` | Envoyer un message général (individuel ou de masse) | Oui | Admin |
| `PUT` | `/messages/:id` | Valider / Publier une annonce en attente | Oui | Admin |
| `GET` | `/messages-internes` | Charger les rapports enseignants (reçus ou envoyés) | Oui | Admin, Enseignant |
| `POST` | `/messages-internes` | Envoyer une remarque / un rapport de discipline | Oui | Enseignant |
| `POST` | `/messages-internes/:id/repondre` | Répondre à un rapport d'un enseignant | Oui | Admin |

### 📈 Statistiques & Tableaux de bord
| Méthode | Route | Description | Auth requise | Rôles autorisés |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/stats` | Données consolidées pour le tableau de bord global | Oui | Admin |

### ⚠️ Rapports de Discipline
| Méthode | Route | Description | Auth requise | Rôles autorisés |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/rapports` | Historique de tous les incidents de discipline enregistrés | Oui | Admin |
| `POST` | `/rapports` | Créer un rapport de discipline officiel (Avertissement, Exclusion, etc.) | Oui | Admin |

---

## 🔒 Authentification (JWT)

L'API sécurise ses endpoints via le standard **JSON Web Token** (JWT) :
1. L'utilisateur envoie son `username` et son `password` sur la route `POST /api/auth/login`.
2. Le serveur valide les identifiants en comparant les empreintes `bcryptjs` et génère un jeton JWT contenant son ID et son rôle.
3. Le client doit stocker ce jeton et l'injecter dans chaque requête HTTP ultérieure au sein du header d'autorisation :
   ```text
   Authorization: Bearer <votre_token_jwt>
   ```
4. Les rôles applicatifs sont validés côté backend par le middleware `restrictTo` :
   * **`admin` :** Accès total aux outils financiers, académiques et aux configurations.
   * **`teacher` :** Accès limité à la saisie de ses notes, fiches de paie, élèves associés et messages.
   * **`parent` :** Accès en lecture seule aux notes, bulletins et historique financier de ses propres enfants uniquement.

---

## 💾 Soft Delete (Suppression Logique)

Afin de préserver l'historique académique et d'éviter les pertes accidentelles de données, l'API implémente un système de **Soft Delete** :
* Les suppressions d'entités (élèves, enseignants, parents, créneaux de planning, etc.) ne retirent pas physiquement les lignes de la base de données.
* Une colonne `isDeleted` (de type `TINYINT(1)`, par défaut `0`) passe à `1` lors de la suppression.
* La plupart des requêtes de lecture filtrent automatiquement les entités pour n'afficher que les lignes actives (`isDeleted = 0`).
* Pour chaque module, une route de restauration `PATCH /api/<module>/:id/restaurer` permet à l'administrateur de récupérer instantanément une entité archivée par erreur.

---

## 📅 Gestion Multi-Année

L'API assure un cloisonnement étanche des données d'une année sur l'autre grâce à un middleware d'année académique (`anneeMiddleware`) :
* Chaque année d'étude possède un enregistrement dans la table `AnneeAcademique`. L'une d'entre elles est configurée comme active (`statut = 1`).
* Le middleware `injectAnnee` intercepte chaque requête entrante et injecte automatiquement l'identifiant de l'année en cours (`idAnnee`) dans `req.query` ou `req.body` si aucun filtre spécifique n'est passé.
* Cela permet aux enseignants et administrateurs de travailler sur les plannings, notes et scolarités de l'année courante de manière totalement transparente, tout en conservant la possibilité de consulter les archives en modifiant manuellement le paramètre d'année académique.

---

## 💳 Intégration Fintech (Paiement CinetPay)

L'API offre un processus automatisé de recouvrement des frais de scolarité via le fournisseur panafricain **CinetPay** :
1. **Initiation :** Le parent d'élève initie un paiement mobile (Mobile Money, Carte Bancaire) sur son interface frontend. La route `POST /api/paiements/initier` prépare la transaction et contacte l'API CinetPay pour obtenir un lien de paiement sécurisé.
2. **Redirection :** Le client est redirigé vers le portail marchand de CinetPay pour valider son versement.
3. **Webhook de notification :** Au terme de la transaction (succès ou échec), CinetPay envoie une requête HTTP POST (Notification) vers l'endpoint public `/api/paiements/notify` du serveur.
4. **Vérification & Validation :** Le backend réceptionne la notification, interroge l'API de CinetPay pour s'assurer que la transaction est légitime, puis met à jour instantanément la base de données de scolarité (mise à jour des tranches payées pour l'élève correspondant) et enregistre le paiement avec succès.

---

## 📜 Scripts disponibles

Dans le dossier `ProjetBD` :

* `npm start` : Démarre le serveur Node.js en production.
* `npm run dev` : Démarre le serveur Node.js en mode de développement avec `nodemon` pour un rechargement à chaud.

---

## 📄 Licence

Ce projet est sous licence [MIT](LICENSE).
