const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Créer le dossier d'upload s'il n'existe pas
const createUploadDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// ── Upload photos élèves ─────────────────────────────────────
const photosStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', '..', 'uploads', 'photos');
    createUploadDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `eleve_${Date.now()}${ext}`);
  },
});

const photoFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Seules les images sont acceptées'), false);
  }
};

exports.uploadPhoto = multer({
  storage: photosStorage,
  fileFilter: photoFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
}).single('photo');

// Alias pour plus de clarté dans d'autres modules
exports.uploadUserPhoto = exports.uploadPhoto;

// ── Upload documents épreuves ────────────────────────────────
const epreuvesStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', '..', 'uploads', 'epreuves');
    createUploadDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = file.originalname.replace(/[^a-zA-Z0-9]/g, '_').replace(ext, '');
    cb(null, `epreuve_${name}_${Date.now()}${ext}`);
  },
});

const epreuveFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp',
                   'application/pdf', 'application/msword',
                   'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non autorisé. Utilisez : image, PDF, Word'), false);
  }
};

exports.uploadEpreuve = multer({
  storage: epreuvesStorage,
  fileFilter: epreuveFilter,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
}).single('document');

// ── Middleware de gestion d'erreur multer ───────────────────
// ── Middleware pour parsing multipart sans fichiers ─────────
exports.uploadNone = multer().none();

// ── Wrapper pour capturer les erreurs multer dans les routes ──
exports.handleUpload = (middleware) => {
  return (req, res, next) => {
    middleware(req, res, (err) => {
      if (err) {
        return exports.handleMulterError(err, req, res, next);
      }
      next();
    });
  };
};

exports.handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'Fichier trop volumineux' });
    }
    return res.status(400).json({ message: err.message });
  }
  if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
};
