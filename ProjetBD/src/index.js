require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { mountSwagger } = require('./utils/swagger');

const app = express();

const LOCAL_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
];

function isOriginAllowed(origin) {
  if (!origin) return true;
  if (LOCAL_ORIGINS.includes(origin)) return true;

  const clientUrl = process.env.CLIENT_URL?.replace(/\/$/, '');
  if (clientUrl && origin === clientUrl) return true;

  try {
    const { hostname } = new URL(origin);
    if (hostname.endsWith('.vercel.app')) return true;
  } catch {
    return false;
  }

  return false;
}

// ─── Middleware globaux ───────────────────────────────────────
app.use(cors({
  origin(origin, callback) {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origine non autorisée (${origin})`));
    }
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const { injectAnnee } = require('./middleware/anneeMiddleware');
app.use(injectAnnee);


// ─── Fichiers statiques (photos, reçus uploadés) ─────────────
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ─── Documentation Swagger ───────────────────────────────────
mountSwagger(app);

// ─── Routes ──────────────────────────────────────────────────
app.use('/api/auth',        require('./routes/authRoutes'));
app.use('/api/eleves',      require('./routes/eleveRoutes'));
app.use('/api/enseignants', require('./routes/enseignantRoutes'));
app.use('/api/classes',     require('./routes/classeRoutes'));
app.use('/api/cycles',      require('./routes/cycleRoutes'));
app.use('/api/salles',      require('./routes/salleRoutes'));
app.use('/api/matieres',    require('./routes/coursRoutes'));
app.use('/api/parents',     require('./routes/parentRoutes'));
app.use('/api/annees-academiques', require('./routes/anneeAcademiqueRoutes'));
app.use('/api/scolarite',   require('./routes/scolariteRoutes'));
app.use('/api/tranches',    require('./routes/trancheRoutes'));
app.use('/api/paiements',   require('./routes/paiementRoutes'));
app.use('/api/modes-paiement', require('./routes/modeRoutes'));
app.use('/api/trimestres',  require('./routes/trimestreRoutes'));
app.use('/api/sessions',    require('./routes/sessionRoutes'));
app.use('/api/natures-epreuve', require('./routes/natureEpreuveRoutes'));
app.use('/api/epreuves',    require('./routes/epreuveRoutes'));
app.use('/api/grades',      require('./routes/gradeRoutes'));
app.use('/api/evaluations', require('./routes/evaluationRoutes'));
app.use('/api/planning',    require('./routes/planningRoutes'));
app.use('/api/emploi-du-temps', require('./routes/planningRoutes'));
app.use('/api/livres', require('./routes/livreRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/messages-internes', require('./routes/messageInterneRoutes'));
app.use('/api/messages-parents', require('./routes/messageParentRoutes'));
app.use('/api/devoirs', require('./routes/devoirRoutes'));
app.use('/api/fiches-enseignant', require('./routes/salaireRoutes'));
app.use('/api/salaires', require('./routes/salaireRoutes'));
app.use('/api/enseignant/salaire', require('./routes/enseignantSalaireRoutes'));
app.use('/api/bulletins', require('./routes/bulletinRoutes'));
app.use('/api/rapports', require('./routes/rapportRoutes'));
app.use('/api/stats', require('./routes/statsRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/personnes', require('./routes/personneRoutes'));
app.use('/api/specialites', require('./routes/specialiteRoutes'));
const planningController = require('./controllers/planningController');
app.get('/api/jours-semaine', planningController.getJoursSemaine);

const authMW = require('./middleware/authMiddleware');
const rapportController = require('./controllers/rapportController');
app.get('/api/justificatifs', rapportController.getJustificatifs);
app.post('/api/justificatifs', rapportController.createJustificatif);
app.put('/api/justificatifs/:id/valider', authMW, authMW.restrictTo('admin', 'teacher', 'scolarite'), rapportController.validerJustificatif);
app.get('/api/disciplines', rapportController.getDisciplines);

// ─── Route de santé ──────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ─── Gestion des routes inconnues ────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: 'Route non trouvée' });
});

// ─── Gestionnaire d'erreurs global ───────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${err.message}`);
  const status = err.status || 500;
  res.status(status).json({
    message: err.message || 'Erreur interne du serveur',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ─── Démarrage ───────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Serveur démarré sur http://localhost:${PORT}`);
  console.log(`📚 Swagger disponible sur http://localhost:${PORT}/api-docs`);
});

module.exports = app;
