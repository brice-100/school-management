const asyncHandler = require('../utils/asyncHandler');
const paiementModel = require('../models/paiementModel');

/**
 * GET /api/paiements
 * Admin : tous les paiements avec filtres (valide, idAca, matricule)
 */
const getAll = asyncHandler(async (req, res) => {
  const filters = { ...req.query };
  if (req.query.archives === '1') filters.isDeleted = 1;
  else filters.isDeleted = 0;
  const paiements = await paiementModel.findAll(filters);
  return res.status(200).json({ total: paiements.length, data: paiements });
});

/**
 * GET /api/paiements/recents
 * Admin : derniers paiements (limit configurable)
 */
const getRecents = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const paiements = await paiementModel.findRecents(limit);
  return res.status(200).json({ total: paiements.length, data: paiements });
});

/**
 * GET /api/paiements/mon-compte
 * Parent : paiements de ses enfants
 */
const getParentPaiements = asyncHandler(async (req, res) => {
  const idPers = req.user.id;
  const paiements = await paiementModel.findByParent(idPers, req.query);
  return res.status(200).json({ total: paiements.length, data: paiements });
});

/**
 * GET /api/paiements/:id
 */
const getOne = asyncHandler(async (req, res) => {
  const paie = await paiementModel.findById(parseInt(req.params.id));
  if (!paie) return res.status(404).json({ message: 'Paiement introuvable' });
  return res.status(200).json({ data: paie });
});

/**
 * POST /api/paiements
 * Admin : enregistre directement un paiement validé
 */
const create = asyncHandler(async (req, res) => {
  const data = { ...req.body, idPers: req.user.id };
  const idPaie = await paiementModel.create(data);
  // Admin qui saisit = paiement directement validé
  await paiementModel.valider(idPaie, data.type_paiement || 'cash');
  const paiement = await paiementModel.findById(idPaie);
  return res.status(201).json({ message: 'Paiement enregistré', data: paiement });
});

/**
 * POST /api/paiements/initier
 * Parent : initie un paiement (statut en attente, admin doit valider)
 * Gère Cash, Mobile Money, Orange Money (simulation)
 */
const initier = asyncHandler(async (req, res) => {
  const { matricule, idMode, idAca, idTranche, type_paiement, phone_paiement, montant } = req.body;

  if (!matricule || !idMode || !idAca) {
    return res.status(400).json({ message: 'matricule, idMode et idAca sont requis' });
  }

  const data = {
    matricule,
    idAca,
    idMode,
    idTranche: idTranche || null,
    type_paiement: type_paiement || 'cash',
    phone_paiement: phone_paiement || null,
    montant: montant || 0,
    idPers: req.user.id,
    comentaire: req.body.comentaire || '',
    operation_ID: `INIT-${Date.now()}`,
    valide: 0, // En attente de validation admin
  };

  const idPaie = await paiementModel.create(data);
  const paiement = await paiementModel.findById(idPaie);

  // Simulation Mobile Money / Orange Money
  let instructions = null;
  if (type_paiement === 'mobile_money') {
    instructions = {
      type: 'Mobile Money (MTN)',
      numero: '+237 6XX XXX XXX',
      nom: 'École Manager',
      reference: data.operation_ID,
      message: `Effectuez le virement MTN Mobile Money au numéro indiqué avec la référence ${data.operation_ID}. L'administrateur validera votre paiement dès réception.`,
    };
  } else if (type_paiement === 'orange_money') {
    instructions = {
      type: 'Orange Money',
      numero: '+237 6XX XXX XXX',
      nom: 'École Manager',
      reference: data.operation_ID,
      message: `Effectuez le virement Orange Money au numéro indiqué avec la référence ${data.operation_ID}. L'administrateur validera votre paiement dès réception.`,
    };
  }

  return res.status(201).json({
    message: type_paiement === 'cash'
      ? 'Demande de paiement cash enregistrée. L\'administrateur la traitera.'
      : `Demande de virement enregistrée. Référence : ${data.operation_ID}`,
    data: paiement,
    instructions,
  });
});

/**
 * PATCH /api/paiements/:id/valider
 * Admin : valide un paiement en attente
 */
const valider = asyncHandler(async (req, res) => {
  const idPaie = parseInt(req.params.id);
  const { modeReglement } = req.body;

  const existing = await paiementModel.findById(idPaie);
  if (!existing) return res.status(404).json({ message: 'Paiement introuvable' });

  await paiementModel.valider(idPaie, modeReglement || existing.type_paiement || 'cash');
  const paiement = await paiementModel.findById(idPaie);
  return res.status(200).json({ message: 'Paiement validé avec succès', data: paiement });
});

/**
 * GET /api/paiements/summary
 * Parent : résumé financier (Total dû, Total payé, Reste)
 */
const getSummary = asyncHandler(async (req, res) => {
  const idPers = req.user.id;
  const summary = await paiementModel.getSummaryByParent(idPers, req.query);
  return res.status(200).json({ data: summary });
});

/**
 * GET /api/paiements/details-enfants
 * Parent : détail des paiements par enfant (montant dû, payé, reste)
 */
const getDetailsEnfants = asyncHandler(async (req, res) => {
  const idPers = req.user.id;
  const details = await paiementModel.getDetailsEnfants(idPers, req.query);
  return res.status(200).json({ total: details.length, data: details });
});

const getSituationFinanciere = asyncHandler(async (req, res) => {
  const situation = await paiementModel.getSituationFinanciere(req.query);
  return res.status(200).json({ total: situation.length, data: situation });
});

const remove = asyncHandler(async (req, res) => {
  await paiementModel.remove(parseInt(req.params.id));
  return res.status(200).json({ message: 'Paiement supprimé logiquement' });
});

const restore = asyncHandler(async (req, res) => {
  await paiementModel.restore(parseInt(req.params.id));
  return res.status(200).json({ message: 'Paiement restauré avec succès' });
});

module.exports = { getAll, getRecents, getParentPaiements, getSummary, getDetailsEnfants, getSituationFinanciere, getOne, create, initier, valider, remove, restore };
