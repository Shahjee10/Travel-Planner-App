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

// Upload photo to trip gallery (existing)
router.post('/:tripId/photos', protect, upload.single('image'), async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: 'No image file uploaded' });
    }

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

// New route: Upload trip background image ONLY (no gallery push), with tripId param
router.post('/:tripId/upload-background', async (req, res) => {
  const { tripId } = req.params;
  const { imageUrl } = req.body;

  try {
    if (!imageUrl) {
      return res.status(400).json({ message: 'No image URL provided' });
    }

    // Optional: verify trip exists
    const trip = await Trip.findById(tripId);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    const uploaded = await cloudinary.uploader.upload(imageUrl, {
      folder: 'trip_backgrounds',
    });

    // Update trip background image URL
    trip.image = uploaded.secure_url;
    await trip.save();

    res.status(200).json({ url: uploaded.secure_url });
  } catch (err) {
    console.error('Background upload error:', err.message);
    res.status(500).json({ message: 'Background image upload failed' });
  }
});

module.exports = router;
