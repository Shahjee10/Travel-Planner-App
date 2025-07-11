const express = require('express');
const router = express.Router();
const {
  createTrip,
  getMyTrips,
  getTripById,
  updateTrip,
  deleteTrip,
} = require('../controllers/tripController');
const { protect } = require('../middleware/authMiddleware');

// /api/trips
router.route('/')
  .post(protect, createTrip)
  .get(protect, getMyTrips);

// /api/trips/:id
router.route('/:id')
  .get(protect, getTripById)
  .put(protect, updateTrip)
  .delete(protect, deleteTrip);

module.exports = router;
