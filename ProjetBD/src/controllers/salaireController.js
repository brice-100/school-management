const asyncHandler = require('../utils/asyncHandler');
const salaireModel = require('../models/salaireModel');

const getAll = asyncHandler(async (req, res) => {
  const filters = { ...req.query };
  if (req.query.archives === '1') filters.isDeleted = 1;
  else filters.isDeleted = 0;
  const salaires = await salaireModel.findAll(filters);
  return res.status(200).json({ total: salaires.length, data: salaires });
});

const getRecap = asyncHandler(async (req, res) => {
  const recap = await salaireModel.getRecap(req.query);
  return res.status(200).json({ data: recap });
});

const getOne = asyncHandler(async (req, res) => {
  const salaire = await salaireModel.findById(parseInt(req.params.id));
  if (!salaire) return res.status(404).json({ message: 'Salaire introuvable' });
  return res.status(200).json({ data: salaire });
});

const createFiche = asyncHandler(async (req, res) => {
  const idFiche = await salaireModel.create(req.body);
  const fiche = await salaireModel.findById(idFiche);
  return res.status(201).json({ message: 'Fiche créée', data: fiche });
});

const updateFiche = asyncHandler(async (req, res) => {
  const idFiche = parseInt(req.params.id);
  await salaireModel.update(idFiche, req.body);
  const fiche = await salaireModel.findById(idFiche);
  return res.status(200).json({ message: 'Fiche modifiée', data: fiche });
});

const payer = asyncHandler(async (req, res) => {
  const idFiche = parseInt(req.params.id);
  await salaireModel.update(idFiche, { 
    statut: 'paye', 
    date_paiement: new Date().toISOString().split('T')[0] 
  });
  return res.status(200).json({ message: 'Salaire marqué comme payé' });
});

const genererMois = asyncHandler(async (req, res) => {
  const { mois, annee, montant_defaut } = req.body;
  if (!mois || !annee || !montant_defaut) {
    return res.status(400).json({ message: 'mois, annee et montant_defaut sont requis.' });
  }
  const pool = require('../config/db');
  // Récupérer tous les enseignants actifs
  const [enseignants] = await pool.query(
    'SELECT idEnseignant FROM Enseignant WHERE Actif = 1'
  );
  if (enseignants.length === 0) {
    return res.status(200).json({ message: 'Aucun enseignant actif trouvé.', created: 0 });
  }
  let created = 0;
  let skipped = 0;
  for (const ens of enseignants) {
    try {
      await pool.query(
        'INSERT INTO salaires (teacher_id, montant, mois, annee, statut, idAnnee, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
        [ens.idEnseignant, parseFloat(montant_defaut), mois, parseInt(annee), 'non_paye', req.body.idAnnee || 1]
      );
      created++;
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') skipped++;
      else throw err;
    }
  }
  return res.status(200).json({
    message: `${created} fiche(s) créée(s), ${skipped} déjà existante(s) ignorée(s).`,
    created,
    skipped,
  });
});

const remove = asyncHandler(async (req, res) => {
  await salaireModel.remove(parseInt(req.params.id));
  return res.status(200).json({ message: 'Salaire supprimé logiquement' });
});

const restore = asyncHandler(async (req, res) => {
  await salaireModel.restore(parseInt(req.params.id));
  return res.status(200).json({ message: 'Salaire restauré avec succès' });
});

module.exports = { getAll, getRecap, getOne, createFiche, updateFiche, payer, genererMois, remove, restore };
