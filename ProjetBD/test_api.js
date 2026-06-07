require('dotenv').config();
const jwt = require('jsonwebtoken');

async function testApi() {
  const token = jwt.sign({ id: 1, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });
  try {
    const res = await fetch('http://localhost:5000/api/paiements/situation-financiere?idAca=2', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.text();
    console.log("Status:", res.status);
    console.log("Response:", data);
  } catch (err) {
    console.error("Fetch Error:", err);
  }
}

testApi();
