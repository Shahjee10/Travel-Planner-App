const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/authMiddleware');
const { uploadPhotoToTrip, deletePhotoFromTrip } = require('../controllers/photoController');
const {
  createTrip,
  getMyTrips,
  getTripById,
  updateTrip,
  deleteTrip,
} = require('../controllers/tripController');

// Setup multer middleware
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ✅ Fix: use multer middleware here
router.post('/:tripId/photos', protect, upload.single('image'), uploadPhotoToTrip);
router.delete('/:tripId/photos/:publicId', protect, deletePhotoFromTrip);

// Trip routes
router.route('/')
  .post(protect, createTrip)
  .get(protect, getMyTrips);

router.route('/:id')
  .get(protect, getTripById)
  .put(protect, updateTrip)
  .delete(protect, deleteTrip);

module.exports = router;
