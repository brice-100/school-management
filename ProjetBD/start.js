require('dotenv').config();
const { fork } = require('child_process');

// Lance les migrations en arrière-plan (non bloquant)
// Le serveur Express démarre immédiatement → évite le timeout du healthcheck Railway
console.log('🔄 Lancement des migrations en arrière-plan...');
const migrator = fork(require.resolve('./run_migrations.js'));

migrator.on('exit', (code) => {
  if (code === 0) {
    console.log('✅ Migrations terminées avec succès');
  } else {
    console.error(`❌ Échec des migrations (code: ${code}) — le serveur continue`);
  }
});

// Démarrer le serveur Express immédiatement
require('./src/index.js');
