const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

router.get('/profile', protect, async (req, res) => {
  try {
    // Send only necessary user info
    res.status(200).json({
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
