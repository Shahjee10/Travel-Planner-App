const mongoose = require('mongoose');

const itineraryItemSchema = new mongoose.Schema({
  day: Number,
  activities: [String],
  notes: String,
});

const tripSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: { type: String, required: true },
  description: { type: String },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  itinerary: [itineraryItemSchema],

    image: { type: String }, // ✅ add this for background image


  // Add photos inside tripSchema here:
  photos: [
    {
      url: String,
      public_id: String,
      uploadedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],

}, { timestamps: true });

module.exports = mongoose.model('Trip', tripSchema);
