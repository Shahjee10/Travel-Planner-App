const Trip = require('../models/Trip');
const crypto = require('crypto'); // For generating random shareId


// @desc Create a new trip
// @route POST /api/trips
// @access Private
exports.createTrip = async (req, res) => {
  const { title, description, startDate, endDate, itinerary, image } = req.body;

  // Validation: Required fields
  if (!title || !startDate || !endDate) {
    return res.status(400).json({ message: 'Title, start and end date required' });
  }

  // Log user info from auth middleware
  console.log('CreateTrip: req.user =', req.user);

  // Authorization check (keep existing)
  if (!req.user || !req.user._id) {
    return res.status(401).json({ message: 'Not authorized, user info missing' });
  }

  try {
    // Validate date formats
    if (isNaN(Date.parse(startDate)) || isNaN(Date.parse(endDate))) {
      return res.status(400).json({ message: 'Invalid date format' });
    }

    let finalImageUrl = image; 
    // 🆕 Change: Store Pixabay image permanently in Cloudinary
    if (image && image.includes('pixabay.com')) {
      try {
        // 1. Download the image from Pixabay
        const response = await axios.get(image, { responseType: 'arraybuffer' });

        // 2. Upload the image to your own Cloudinary storage
        const uploadResult = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { folder: 'trip_location_images' },
            (error, result) => {
              if (error) return reject(error);
              resolve(result);
            }
          );
          uploadStream.end(Buffer.from(response.data));
        });

        // 3. Replace image URL with Cloudinary URL
        finalImageUrl = uploadResult.secure_url;
      } catch (err) {
        console.error('Pixabay to Cloudinary upload failed:', err);
        // Fallback: Keep the original Pixabay URL if Cloudinary upload fails
        finalImageUrl = image;
      }
    }

    // Create trip in DB
    const newTrip = new Trip({
      user: req.user._id,
      title,
      description,
      startDate,
      endDate,
      itinerary,
      image: finalImageUrl, // Use the permanent URL if available
    });

    const savedTrip = await newTrip.save();
    res.status(201).json(savedTrip);
  } catch (error) {
    console.error('CreateTrip Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


// @desc Get all trips of logged-in user
// @route GET /api/trips
// @access Private
exports.getMyTrips = async (req, res) => {
  try {
    const trips = await Trip.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(trips);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc Get single trip
// @route GET /api/trips/:id
// @access Private
exports.getTripById = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);

    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    if (trip.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(trip);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc Update a trip
// @route PUT /api/trips/:id
// @access Private
exports.updateTrip = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);

    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    if (trip.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { title, description, startDate, endDate, itinerary, image } = req.body; // added image

    trip.title = title || trip.title;
    trip.description = description || trip.description;
    trip.startDate = startDate || trip.startDate;
    trip.endDate = endDate || trip.endDate;
    trip.itinerary = itinerary || trip.itinerary;
    trip.image = image || trip.image; // update image if provided

    const updated = await trip.save();
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};


// @desc Delete a trip
// @route DELETE /api/trips/:id
// @access Private
exports.deleteTrip = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);

    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    // Only allow user who owns the trip to delete it
    if (trip.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Trip.findByIdAndDelete(req.params.id);

    res.json({ message: 'Trip deleted' });
  } catch (error) {
    console.error('DeleteTrip Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};



const cloudinary = require('../utils/cloudinary');

// @desc Delete a photo from a trip
// @route DELETE /api/trips/:tripId/photos/:publicId
// @access Private
exports.deletePhotoFromTrip = async (req, res) => {
  const { tripId, publicId } = req.params;

  try {
    const trip = await Trip.findById(tripId);

    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    if (trip.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Find the photo inside the trip's photos array
    const photo = trip.photos.find((p) => p.public_id === publicId);
    if (!photo) return res.status(404).json({ message: 'Photo not found' });

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(publicId);

    // Remove from MongoDB photos array
    trip.photos = trip.photos.filter((p) => p.public_id !== publicId);
    await trip.save();

    res.json({ message: 'Photo deleted successfully' });
  } catch (error) {
    console.error('DeletePhoto Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// POST /api/trips/:id/share
// Generate a unique shareId for a trip (if not already set)
exports.generateShareId = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    // Only allow the owner to generate shareId
    if (trip.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (!trip.shareId) {
      // Generate a random, unguessable string
      trip.shareId = crypto.randomBytes(8).toString('hex');
      await trip.save();
    }
    res.json({ shareId: trip.shareId });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
