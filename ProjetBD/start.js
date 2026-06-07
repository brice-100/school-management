require('dotenv').config();
const { execSync } = require('child_process');

// Lance les migrations, puis démarre le serveur
// Compatible Linux (Railway) et Windows (local)
try {
  console.log('🔄 Lancement des migrations...');
  execSync('node run_migrations.js', { stdio: 'inherit' });
  console.log('✅ Migrations terminées');
} catch (err) {
  console.error('⚠️  Erreur lors des migrations (non bloquante) :', err.message);
  // On ne bloque pas le démarrage du serveur si les migrations échouent
}

// Démarrer le serveur Express
require('./src/index.js');
