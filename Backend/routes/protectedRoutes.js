const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

router.get('/profile', protect, (req, res) => {
  // `req.user` was attached by the middleware
  res.json({
    id: req.user._id,
    name: req.user.name,
    email: req.user.email,
  });
});

module.exports = router;
