const bcrypt          = require('bcryptjs');
const asyncHandler    = require('../utils/asyncHandler');
const { generateToken } = require('../utils/jwtHelper');
const adminModel      = require('../models/adminModel');
const personneModel   = require('../models/personneModel');

// Message générique pour ne pas révéler si c'est le username ou le password qui est faux
const INVALID_CREDENTIALS = 'Identifiants incorrects';

/**
 * POST /api/auth/login
 * Body : { username, password, userType: 'admin' | 'personne' }
 */
const login = asyncHandler(async (req, res) => {
  const { username, password, userType } = req.body;

  // ─── 1. Chercher l'utilisateur selon son type ─────────────
  let user = null;

  if (userType === 'admin') {
    user = await adminModel.findByUsername(username);
  } else if (userType === 'personne' || userType === 'teacher' || userType === 'parent') {
    user = await personneModel.findByUsername(username);
  } else {
    return res.status(400).json({ message: 'userType invalide (admin | teacher | parent)' });
  }

  if (!user) {
    return res.status(401).json({ message: INVALID_CREDENTIALS });
  }

  // ─── 2. Vérifier l'activation (pour les Personnes : enseignants, parents, etc.) ─────────────
  if (userType !== 'admin') {
    if (user.actif === 0) {
      return res.status(403).json({ message: 'Votre compte est en attente de validation.' });
    }
    if (user.actif === 2) {
      return res.status(403).json({ message: 'Votre compte est suspendu. Veuillez contacter l\'administration.' });
    }
    if (user.actif !== 1) {
      return res.status(403).json({ message: 'Votre compte n\'est pas actif.' });
    }
  }

  // ─── 3. Vérifier le mot de passe ──────────────────────────
  const passwordOK = await bcrypt.compare(password, user.password);
  if (!passwordOK) {
    return res.status(401).json({ message: INVALID_CREDENTIALS });
  }

  // ─── 4. Construire le payload JWT selon le type ───────────
  let payload;
  let userData;

  if (userType === 'admin') {
    payload = {
      id:       user.ID,
      userType: 'admin',
      role:     user.typeAdmin,   // 0=root, 1=admin, 2=fondateur, 3=directeur
    };
    userData = {
      id:        user.ID,
      nom:       user.nom,
      prenom:    '', // La table admin n'a pas de prenom
      username:  user.username,
      typeAdmin: user.typeAdmin,
      mobile:    user.mobile,
      role:      'admin'
    };
  } else {
    payload = {
      id:          user.idPers,
      userType:    'personne',
      role:        user.typePersonne, // 1=enseignant, 2=admin, 3=scolarité, 4=parent
    };
    userData = {
      id:           user.idPers,
      idPers:       user.idPers, // Pour compatibilité frontend
      nom:          user.nom,
      prenom:       user.prenom,
      typePersonne: user.typePersonne,
      mobile:       user.mobile,
      role:         user.typePersonne === 1 ? 'teacher' : (user.typePersonne === 4 ? 'parent' : 'autre')
    };
  }

  // ─── 5. Générer le token et répondre ──────────────────────
  const token = generateToken(payload);

  return res.status(200).json({
    message: 'Connexion réussie',
    token,
    user: userData,
  });
});

/**
 * GET /api/auth/me
 * Retourne les infos de l'utilisateur connecté (depuis req.user injecté par authMiddleware)
 */
const me = asyncHandler(async (req, res) => {
  const { id, userType } = req.user;

  let user;
  let userData;
  if (userType === 'admin') {
    user = await adminModel.findById(id);
    if (user) {
      userData = { ...user, prenom: user.prenom || '', role: 'admin' };
    }
  } else {
    user = await personneModel.findById(id);
    if (user) {
      userData = { 
        ...user, 
        id: user.idPers,
        idPers: user.idPers,
        role: user.typePersonne === 1 ? 'teacher' : (user.typePersonne === 4 ? 'parent' : 'autre') 
      };
    }
  }

  if (!user || !userData) {
    return res.status(404).json({ message: 'Utilisateur introuvable' });
  }

  return res.status(200).json({ user: userData });
});


/**
 * POST /api/auth/register/public
 * Inscription publique (Enseignant ou Parent).
 */
const registerPublic = asyncHandler(async (req, res) => {
  const { nom, prenom, email, telephone, mot_de_passe, typePersonne } = req.body;

  if (!nom || !prenom || !telephone || !mot_de_passe) {
    return res.status(400).json({ message: 'Veuillez remplir tous les champs obligatoires' });
  }

  // L'email peut être optionnel selon le frontend (qui utilise username = email ou telephone s'il n'y a pas d'email)
  const username = email || telephone;

  // Vérifier si l'utilisateur existe déjà
  const existingUser = await personneModel.findByUsername(username);
  if (existingUser) {
    return res.status(400).json({ message: 'Cet email ou numéro de téléphone est déjà utilisé' });
  }

  // Hachage du mot de passe
  const hashedPassword = await bcrypt.hash(mot_de_passe, 10);

  // typePersonne: 1 = Enseignant, 4 = Parent
  const typePersonneValue = typePersonne === 'teacher' ? 1 : 4;

  const data = {
    nom,
    prenom,
    mobile: telephone,
    phone: telephone,
    typePersonne: typePersonneValue,
    username,
    password: hashedPassword,
  };

  const insertId = await personneModel.createPendingPersonne(data);

  return res.status(201).json({
    message: 'Inscription réussie. Votre compte est en attente de validation.',
    idPers: insertId
  });
});

module.exports = { login, me, registerPublic };
