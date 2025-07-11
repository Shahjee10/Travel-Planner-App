const Trip = require('../models/Trip');

// @desc Create a new trip
// @route POST /api/trips
// @access Private
exports.createTrip = async (req, res) => {
  const { title, description, startDate, endDate, itinerary } = req.body;

  if (!title || !startDate || !endDate) {
    return res.status(400).json({ message: 'Title, start and end date required' });
  }

  try {
    const newTrip = new Trip({
      user: req.user._id, // coming from authMiddleware
      title,
      description,
      startDate,
      endDate,
      itinerary,
    });

    const savedTrip = await newTrip.save();
    res.status(201).json(savedTrip);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
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

    // Only owner can view it
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

    // Only owner can update
    if (trip.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { title, description, startDate, endDate, itinerary } = req.body;

    trip.title = title || trip.title;
    trip.description = description || trip.description;
    trip.startDate = startDate || trip.startDate;
    trip.endDate = endDate || trip.endDate;
    trip.itinerary = itinerary || trip.itinerary;

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

    if (trip.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Trip.findByIdAndDelete(req.params.id); // ✅ FIXED LINE

    res.json({ message: 'Trip deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

