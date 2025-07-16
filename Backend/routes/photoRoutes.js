const express = require('express');
const multer = require('multer');
const streamifier = require('streamifier');
const cloudinary = require('../utils/cloudinary');
const Trip = require('../models/Trip');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Setup multer to store files in memory
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/:tripId/photos', protect, upload.single('image'), async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: 'No image file uploaded' });
    }

    // Start Cloudinary upload stream
    const streamUpload = () =>
      new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'travel_photos' },
          (error, result) => {
            if (result) resolve(result);
            else reject(error);
          }
        );
        streamifier.createReadStream(file.buffer).pipe(stream);
      });

    const result = await streamUpload();

    const trip = await Trip.findById(req.params.tripId);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    trip.photos.push({
      url: result.secure_url,
      public_id: result.public_id,
    });
    await trip.save();

    res.status(200).json({ message: 'Photo uploaded', url: result.secure_url });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ message: 'Failed to upload image' });
  }
});

module.exports = router;
