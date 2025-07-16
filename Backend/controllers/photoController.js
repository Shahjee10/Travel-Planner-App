const Trip = require('../models/Trip');
const cloudinary = require('../utils/cloudinary');
const streamifier = require('streamifier');

// ✅ Upload a photo to a trip using memory buffer and Cloudinary stream
exports.uploadPhotoToTrip = async (req, res) => {
  try {
    console.log('Received file:', req.file);            // logs uploaded file info
    console.log('Received tripId:', req.params.tripId); // logs tripId from params
    const { tripId } = req.params;

    // 🔍 Check if file is uploaded by multer
    if (!req.file) {
      return res.status(400).json({ message: 'No image provided' });
    }

    // 🔍 Find the trip
    const trip = await Trip.findById(tripId);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    // ☁️ Upload to Cloudinary using stream from buffer
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'trip_photos' },
      async (error, result) => {
        if (error) {
          console.error('Cloudinary error:', error);
          return res.status(500).json({ message: 'Image upload failed', error });
        }

        // ➕ Add uploaded photo to trip
        trip.photos.push({
          url: result.secure_url,
          public_id: result.public_id,
        });

        await trip.save();

        res.status(201).json({ message: 'Photo uploaded', photo: result });
      }
    );

    // 📤 Pipe image buffer to Cloudinary upload stream
    streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
  } catch (err) {
    console.error('Upload photo error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ✅ Delete a photo from a trip
// ✅ Delete a photo from a trip
exports.deletePhotoFromTrip = async (req, res) => {
  const { tripId, publicId } = req.params;

  try {
    // 🧾 Debug logs
    console.log('🗑️ DELETE photo request');
    console.log('Trip ID:', tripId);
    console.log('Raw Public ID:', publicId);

    // 🔍 Check if trip exists
    const trip = await Trip.findById(tripId);
    if (!trip) {
      console.log('❌ Trip not found');
      return res.status(404).json({ message: 'Trip not found' });
    }

    // 🔍 Check if photo exists in trip
    const photo = trip.photos.find((p) => p.public_id === publicId);
    if (!photo) {
      console.log('❌ Photo not found in trip');
      return res.status(404).json({ message: 'Photo not found' });
    }

    // ☁️ Delete from Cloudinary
    const cloudRes = await cloudinary.uploader.destroy(publicId);
    console.log('☁️ Cloudinary delete result:', cloudRes);

    // 🧹 Remove from DB
    trip.photos = trip.photos.filter((p) => p.public_id !== publicId);
    await trip.save();

    // ✅ Success
    res.json({ message: 'Photo deleted successfully' });
  } catch (err) {
    console.error('❌ Delete photo error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
