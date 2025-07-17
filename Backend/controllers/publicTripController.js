const Trip = require('../models/Trip');

// GET /api/public/trip/:shareId
// Public: Get trip details by shareId (no auth required)
exports.getPublicTrip = async (req, res) => {
  try {
    const { shareId } = req.params;
    // Find trip by shareId
    const trip = await Trip.findOne({ shareId });
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    // Only return public fields (no user info, etc.)
    const publicTrip = {
      title: trip.title,
      description: trip.description,
      startDate: trip.startDate,
      endDate: trip.endDate,
      itinerary: trip.itinerary,
      image: trip.image,
      photos: trip.photos,
      createdAt: trip.createdAt,
      updatedAt: trip.updatedAt,
      shareId: trip.shareId,
    };
    res.json(publicTrip);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// (Optional) POST /api/public/trip/:shareId/comments
exports.addPublicComment = async (req, res) => {
  // Not implemented yet
  res.status(501).json({ message: 'Not implemented' });
};

// (Optional) GET /api/public/trip/:shareId/comments
exports.getPublicComments = async (req, res) => {
  // Not implemented yet
  res.status(501).json({ message: 'Not implemented' });
}; 