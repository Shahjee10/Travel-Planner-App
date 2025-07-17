const express = require('express');
const router = express.Router();
const { getPublicTrip, addPublicComment, getPublicComments } = require('../controllers/publicTripController');

// Public: Get trip details by shareId (no auth required)
router.get('/trip/:shareId', getPublicTrip);

// (Optional) Public: Add a comment to a shared trip
router.post('/trip/:shareId/comments', addPublicComment);

// (Optional) Public: Get comments for a shared trip
router.get('/trip/:shareId/comments', getPublicComments);

module.exports = router; 