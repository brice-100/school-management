require('dotenv').config();
const { execSync } = require('child_process');

// Lance les migrations, puis démarre le serveur
// Compatible Linux (Railway) et Windows (local)
const { fork } = require('child_process');

console.log('🔄 Lancement des migrations en arrière-plan...');
const migrator = fork(require.resolve('./run_migrations.js'));

migrator.on('exit', (code) => {
  if (code === 0) {
    console.log('✅ Migrations terminées avec succès');
  } else {
    console.error(`❌ Échec des migrations (code: ${code})`);
  }
});

// Démarrer le serveur Express immédiatement
require('./src/index.js');
