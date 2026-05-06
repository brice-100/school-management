require('dotenv').config({ path: './projetBD/.env' });
const { verifyToken, generateToken } = require('./projetBD/src/utils/jwtHelper');
const axios = require('axios');

async function test() {
  const token = generateToken(1, 'admin', 0); // user id=1, userType=admin, role=0
  const headers = { Authorization: `Bearer ${token}` };

  const endpoints = [
    '/api/stats/overview',
    '/api/notifications',
    '/api/users/pending-count',
    '/api/classes',
    '/api/cycles',
    '/api/salles',
    '/api/annees-academiques',
    '/api/paiements',
    '/api/planning',
  ];

  for (const ep of endpoints) {
    try {
      const res = await axios.get(`http://localhost:5000${ep}`, { headers });
      console.log(`[OK] ${ep}: ${res.status}`);
    } catch (err) {
      console.log(`[FAIL] ${ep}: ${err.response?.status || err.message}`);
    }
  }
}

test();
