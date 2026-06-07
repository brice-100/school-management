const mysql = require('mysql2/promise');

// Support Railway MYSQL_URL ou variables individuelles
function getDbConfig() {
  const dbUrl = process.env.MYSQL_URL || process.env.DATABASE_URL || process.env.MYSQL_PUBLIC_URL;

  if (dbUrl) {
    console.log('📡 Connexion MySQL via URL (MYSQL_URL)');
    const url = new URL(dbUrl);
    return {
      host:     url.hostname,
      port:     parseInt(url.port) || 3306,
      user:     decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: url.pathname.replace(/^\//, ''),
    };
  }

  console.log('📡 Connexion MySQL via variables individuelles (DB_HOST/PORT/USER...)');
  return {
    host:     process.env.DB_HOST     || '127.0.0.1',
    port:     parseInt(process.env.DB_PORT) || 3306,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  };
}

const dbConfig = getDbConfig();
const isProduction = process.env.NODE_ENV === 'production';

// Sur Railway réseau interne (mysql.railway.internal), SSL n'est pas nécessaire
// Sur Railway proxy public (*.proxy.rlwy.net), SSL est requis
const isInternalHost = dbConfig.host && dbConfig.host.includes('railway.internal');
const needsSsl = isProduction && !isInternalHost;

console.log(`🔧 DB Config → host: ${dbConfig.host}, port: ${dbConfig.port}, db: ${dbConfig.database}, ssl: ${needsSsl}`);

const pool = mysql.createPool({
  ...dbConfig,
  connectionLimit:    parseInt(process.env.DB_POOL_LIMIT) || 10,
  waitForConnections: true,
  queueLimit:         0,
  dateStrings:        false,
  ...(needsSsl && { ssl: { rejectUnauthorized: false } }),
});

// Test de connexion au démarrage (non bloquant en prod)
pool.getConnection()
  .then(conn => {
    console.log(`✅ Connexion MySQL établie → ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);
    conn.release();
  })
  .catch(err => {
    console.error(`❌ Connexion MySQL échouée [${dbConfig.host}:${dbConfig.port}] :`, err.message);
    if (!isProduction) {
      process.exit(1);
    }
    console.error('⚠️  Le serveur démarre sans connexion DB — Railway peut retry');
  });

module.exports = pool;
