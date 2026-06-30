const db = require('./src/config/db');
const coursModel = require('./src/models/coursModel');

(async () => {
  try {
    const res = await coursModel.findGrouped();
    console.log("Success:", res.length);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    process.exit(0);
  }
})();
