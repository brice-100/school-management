# ecoleManager — Interface Frontend

L'interface client moderne, réactive et ergonomique d'**ecoleManager**, une plateforme web complète de gestion d'école primaire. Développée en React, Vite et Tailwind CSS, elle propose trois espaces utilisateurs dédiés et personnalisés (Administration, Enseignants, Parents d'élèves). Elle offre une expérience fluide enrichie d'animations fluides, de tableaux de bord financiers interactifs, d'outils de saisie de notes et d'un guichet de paiement de scolarité en ligne.

---

## 🛠️ Stack technique

* **Framework principal :** React 18
* **Outil de build & Dev server :** Vite
* **Routage :** React Router DOM v6
* **Requêtes HTTP :** Axios
* **Stylisation (CSS) :** Tailwind CSS
* **Icônes :** Lucide React
* **Notifications :** React Hot Toast

---

## 📋 Prérequis

* **Node.js** >= 18.x
* **npm** >= 9.x

---

## 🚀 Installation et Démarrage

1. **Naviguer vers le dossier client :**
   ```bash
   cd ecoleManager/client
   ```

2. **Installer les dépendances :**
   ```bash
   npm install
   ```

3. **Configurer les variables d'environnement :**
   Copiez le fichier d'exemple et configurez l'URL d'accès à votre API Backend :
   ```bash
   cp .env.example .env
   ```
   Remplissez le fichier avec l'URL de votre backend :
   ```text
   VITE_API_URL=http://localhost:5000/api
   ```

4. **Lancer le serveur de développement local :**
   ```bash
   npm run dev
   ```
   L'interface sera accessible par défaut sur l'adresse : `http://localhost:5173`.

---

## 🔑 Variables d'environnement (`.env`)

| Variable | Description | Valeur par défaut |
| :--- | :--- | :--- |
| `VITE_API_URL` | URL de base de l'API REST du backend ecoleManager | `http://localhost:5000/api` |

---

## 📂 Structure du projet

L'arborescence du code source frontend est structurée de la manière suivante :

```text
client/
├── src/
│   ├── assets/          # Fichiers statiques, images et styles globaux (index.css)
│   ├── components/      # Composants d'interface réutilisables (Boutons, Tables, Layouts)
│   ├── context/         # Fournisseurs de contextes globaux (AuthContext, YearContext)
│   ├── hooks/           # Hooks React personnalisés réutilisables
│   ├── pages/           # Pages de l'application (segmentées par rôle et fonctionnalité)
│   ├── routes/          # Protections des routes par rôles (PrivateRoute.jsx)
│   ├── services/        # Abstraction des requêtes d'API REST vers le serveur
│   ├── App.jsx          # Déclaration du routeur et montage de l'application
│   └── main.jsx         # Point d'entrée de l'application React
├── package.json
└── vite.config.js
```

---

## 🖥️ Pages disponibles

L'accès aux différentes sections est dynamiquement contrôlé par rôle au niveau du routeur.

| Page | Route | Rôles autorisés | Description |
| :--- | :--- | :--- | :--- |
| **Landing Page** | `/` | Public | Page de présentation de l'école et de ses services |
| **Connexion** | `/login` | Public | Formulaire d'authentification sécurisé |
| **Tableau de bord** | `/dashboard` | Connectés | Synthèse d'activité personnalisée selon le rôle |
| **Élèves** | `/students` | Admin, Enseignant | Liste des élèves, filtres par classe et année |
| **Nouveau / Édition Élève**| `/students/new`, `/students/:id/edit` | Admin | Formulaire d'inscription et édition d'élève (avec photo) |
| **Enseignants** | `/teachers` | Admin | Gestion des enseignants de l'établissement |
| **Parents** | `/parents` | Admin | Liste des parents, liaison enfants et suppression définitive |
| **Classes & Matières** | `/classes` | Admin | Configuration des classes, attribution des professeurs titulaires |
| **Saisie de Notes** | `/grades` | Admin, Enseignant | Saisie interactive et correction des notes par classe |
| **Bulletins** | `/bulletins` | Admin, Enseignant, Parent | Consultation et impression des bulletins trimestriels |
| **Paiements** | `/paiements` | Admin, Parent | Historique des scolarités, initiation de paiement mobile (CinetPay) |
| **Planning** | `/planning` | Admin, Enseignant | Grille hebdomadaire de planification des cours |
| **Salaires** | `/salaires` | Admin | Gestion et suivi des salaires des collaborateurs |
| **Mon Salaire** | `/mon-salaire` | Enseignant | Fiches de paie personnelles de l'enseignant connecté |
| **Messagerie** | `/messagerie` | Admin, Parent | Centre de messagerie générale (communiqués, circulaires parents) |
| **Messagerie Admin** | `/teacher/messagerie` | Enseignant | Formulaire de rapport de discipline et remarques de l'enseignant |
| **Discipline** | `/rapports` | Admin | Enregistrement d'incidents, rapports de discipline officiels |

---

## 📡 Services API

Les services encapsulent les appels réseau avec `axios` et proposent les abstractions suivantes :

### 👤 `authService.js`
* `login(credentials)` : Authentifie l'utilisateur et initialise la session.
* `registerParent(data)` : Inscription publique d'un compte parent.
* `changePassword(data)` : Modifie le mot de passe actuel.

### 🎓 `studentService.js`
* `getStudents(params)` : Récupère la liste des élèves (filtre actif/archivé/classe).
* `createStudent(formData)` : Enregistre un élève (`multipart/form-data` pour l'upload de photo).
* `updateStudent(id, formData)` : Modifie la fiche d'un élève.
* `deleteStudent(id)` : Supprime logiquement un élève.
* `restoreStudent(id)` : Restaure un élève archivé.

### 👩‍🏫 `teacherService.js`
* `getTeachers(params)` : Récupère la liste des enseignants.
* `getTeacherStudents(id)` : Liste des élèves rattachés aux classes de l'enseignant.
* `createTeacher(data)` : Enregistre un nouvel enseignant.

### 👪 `parentService.js`
* `getParents(params)` : Récupère la liste globale des parents d'élèves.
* `getMesEnfants()` : Liste des enfants associés au parent connecté.
* `deleteParent(id)` : Archivage logique du parent d'élève.
* `deleteParentHard(id)` : Suppression définitive du parent en cascade.

### 📝 `gradeService.js`
* `getGrades(params)` : Liste des notes.
* `createGrades(data)` : Enregistre un lot de notes pour une classe et un cours.

### 📅 `planningService.js`
* `getPlannings(params)` : Récupère l'emploi du temps de la classe.
* `createPlanning(data)` : Ajoute un cours dans la grille hebdomadaire.
* `deletePlanning(id)` : Archive un créneau de cours.

### 💬 `messageService.js`
* `getAllMessages(params)` : Charge les messages généraux (parents).
* `sendMessage(data)` : Envoyer un message individuel à un parent.
* `sendMessageMasse(data)` : Envoyer un communiqué général à tous les parents.
* `getInternalMessages()` : Liste des rapports de discipline envoyés par les enseignants.
* `sendInternalMessage(data)` : Envoi d'un rapport de discipline par un enseignant.
* `replyInternalMessage(id, reponse)` : Répondre à un rapport enseignant.
* `markInternalAsLu(id)` : Marquer un rapport comme lu.

---

## 🔒 Gestion des Rôles et Autorisations

La structure de l'interface et ses fonctionnalités s'adaptent dynamiquement au rôle de l'utilisateur connecté :
1. **Administrateur (`admin`) :** Dispose d'un tableau de bord de pilotage global complet. Il a accès à tous les modules de gestion (Utilisateurs, Élèves, Enseignants, Parents, Classes, Comptabilité, Discipline).
2. **Enseignant (`teacher`) :** Accède à un espace de travail focalisé sur sa mission pédagogique. Il peut uniquement consulter son emploi du temps personnel, la liste de ses élèves rattachés, saisir les notes de ses matières, rédiger des rapports administratifs et visualiser ses fiches de paie.
3. **Parent (`parent`) :** Bénéficie d'un portail simplifié et sécurisé pour suivre la scolarité de son enfant. Il peut visualiser son emploi du temps hebdomadaire, consulter ses notes en temps réel, télécharger ses bulletins de notes et s'acquitter en ligne de ses frais de scolarité via le terminal sécurisé.

---

## 🧩 Composants réutilisables clés

* **`Sidebar.jsx` :** Menu latéral dynamique qui segmente la navigation applicative selon le rôle de l'utilisateur et intègre le sélecteur d'année académique active.
* **`AnneeSelector` :** Permet à l'utilisateur de basculer instantanément son filtre de travail d'une année sur l'autre (récupéré depuis `YearContext`).
* **`TableListe` :** Composant générique de tableau stylisé avec recherche instantanée, pagination réactive et gestion des états vides ou en cours de chargement.
* **`BoutonPaiement` :** Composant d'interface qui encapsule l'initiation de la transaction financière CinetPay et redirige le parent d'élève en toute sécurité.

---

## 📜 Scripts disponibles

Dans le dossier `client` :

* `npm run dev` : Démarre le serveur de développement local de Vite (port `5173`).
* `npm run build` : Compile et optimise l'application pour la production (fichiers compilés dans le dossier `/dist`).
* `npm run preview` : Lance un serveur web local pour prévisualiser la version de production construite localement.

---

## 📄 Licence

Ce projet est sous licence [MIT](LICENSE).
