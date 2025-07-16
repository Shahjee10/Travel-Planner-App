const multer = require('multer');

// Store file in memory (you can use diskStorage if needed)
const storage = multer.memoryStorage();
const upload = multer({ storage });

module.exports = upload;
