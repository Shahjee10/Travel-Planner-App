const express = require('express');
const multer = require('multer');
const cloudinary = require('../utils/cloudinary');
const Trip = require('../models/Trip');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Setup multer
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Upload photo to a trip
router.post('/:tripId/photos', protect, upload.single('image'), async (req, res) => {
  try {
    const result = await cloudinary.uploader.upload_stream(
      { folder: 'travel_photos' },
      async (error, result) => {
        if (error) return res.status(500).json({ message: 'Cloudinary error' });

        const trip = await Trip.findById(req.params.tripId);
        if (!trip) return res.status(404).json({ message: 'Trip not found' });

        trip.photos.push({
          url: result.secure_url,
          public_id: result.public_id,
        });
        await trip.save();

        res.status(200).json({ message: 'Photo uploaded', url: result.secure_url });
      }
    );

    result.end(req.file.buffer); // send file buffer to cloudinary stream
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to upload image' });
  }
});

module.exports = router;
