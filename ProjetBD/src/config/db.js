const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host:              process.env.DB_HOST     || '127.0.0.1',
  port:              parseInt(process.env.DB_PORT) || 3306,
  user:              process.env.DB_USER,
  password:          process.env.DB_PASSWORD ,
  database:          process.env.DB_NAME     ,
  connectionLimit:   parseInt(process.env.DB_POOL_LIMIT) || 10,
  waitForConnections: true,
  queueLimit:        0,
  // Retourne les dates JS sans les convertir en string
  dateStrings:       false,
});

// Test de connexion au démarrage
pool.getConnection()
  .then(conn => {
    console.log('✅ Connexion MySQL établie');
    conn.release();
  })
  .catch(err => {
    console.error('❌ Impossible de se connecter à MySQL :', err.message);
    process.exit(1);
  });

module.exports = pool;
