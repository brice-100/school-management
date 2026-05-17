require('dotenv').config();
const pool = require('./src/config/db');
pool.query("SHOW TABLES").then(([rows]) => {
  console.log('Tables:', rows);
  process.exit(0);
});
