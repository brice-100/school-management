/**
 * import_railway.js
 * Importe le schéma SQL dans la base MySQL de Railway.
 *
 * Usage :
 *   node import_railway.js --url "mysql://user:pass@host:port/dbname"
 * ou avec variables d'environnement :
 *   set RAILWAY_DB_URL=mysql://... && node import_railway.js
 */

const mysql = require('mysql2/promise');
const fs    = require('fs');
const path  = require('path');

// ──────────────────────────────────────────────────────────────
// 1. Récupérer l'URL Railway (argument CLI ou env)
// ──────────────────────────────────────────────────────────────
const args   = process.argv.slice(2);
const urlArg = args.find(a => a.startsWith('--url='))?.split('=').slice(1).join('=')
            || args[args.indexOf('--url') + 1];
const dbUrl  = urlArg || process.env.RAILWAY_DB_URL;

if (!dbUrl) {
  console.error(`
❌  Aucune URL fournie.

Utilisation :
  node import_railway.js --url "mysql://user:password@host:port/database"

L'URL se trouve dans Railway → service MySQL → Variables → MYSQL_PUBLIC_URL
`);
  process.exit(1);
}

// ──────────────────────────────────────────────────────────────
// 2. Parser l'URL mysql://user:pass@host:port/dbname
// ──────────────────────────────────────────────────────────────
function parseDbUrl(url) {
  try {
    // mysql://user:pass@host:port/dbname
    const u = new URL(url);
    return {
      host:     u.hostname,
      port:     parseInt(u.port) || 3306,
      user:     decodeURIComponent(u.username),
      password: decodeURIComponent(u.password),
      database: u.pathname.replace(/^\//, ''),
    };
  } catch {
    console.error('❌ URL invalide :', url);
    process.exit(1);
  }
}

// ──────────────────────────────────────────────────────────────
// 3. Import
// ──────────────────────────────────────────────────────────────
async function importToRailway() {
  const creds = parseDbUrl(dbUrl);

  console.log(`\n📡 Connexion à Railway MySQL...`);
  console.log(`   Host: ${creds.host}:${creds.port}`);
  console.log(`   DB  : ${creds.database}`);
  console.log(`   User: ${creds.user}\n`);

  const pool = mysql.createPool({
    ...creds,
    multipleStatements: true,
    ssl: { rejectUnauthorized: false },
  });

  // Choisir le bon fichier SQL
  const sqlFile = fs.existsSync(path.join(__dirname, 'school_fixed.sql'))
    ? 'school_fixed.sql'
    : 'Alanya_13Avril_MySQL.sql';

  const sqlPath = path.join(__dirname, sqlFile);
  console.log(`📂 Fichier SQL : ${sqlFile}`);

  try {
    const sql = fs.readFileSync(sqlPath, 'utf8');
    console.log('⏳ Import en cours...');
    await pool.query(sql);
    console.log('✅ Schéma importé avec succès !');

    // Lancer les migrations
    console.log('\n🔄 Exécution des migrations...');
    const { execSync } = require('child_process');
    process.env.DB_HOST     = creds.host;
    process.env.DB_PORT     = String(creds.port);
    process.env.DB_USER     = creds.user;
    process.env.DB_PASSWORD = creds.password;
    process.env.DB_NAME     = creds.database;
    try {
      execSync('node run_migrations.js', { stdio: 'inherit' });
    } catch (e) {
      console.warn('⚠️  Migrations partiellement échouées (peut être ignoré si déjà appliquées)');
    }

    console.log('\n🎉 Base de données Railway prête !');
  } catch (err) {
    console.error('❌ Erreur lors de l\'import :', err.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

importToRailway();
