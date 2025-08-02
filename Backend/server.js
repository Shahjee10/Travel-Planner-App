const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const photoRoutes = require('./routes/photoRoutes');
const imageRoutes = require('./routes/imageRoutes');

dotenv.config(); // Load environment variables from .env

const app = express();
connectDB(); // Connect to MongoDB

app.use(express.json()); // Middleware to parse JSON request bodies

// ✅ FIXED: Mount user authentication routes under /api/auth
app.use('/api/users', require('./routes/userRoutes'));

// ✅ Main route for protected user functionality
app.use('/api/protected', require('./routes/protectedRoutes'));

// ✅ Main route for trips (create, fetch, delete, etc.)
app.use('/api/trips', require('./routes/tripRoutes'));

// ✅ Route for accessing public trips
app.use('/api/public', require('./routes/publicTripRoutes'));

// ✅ Mount trip gallery photo upload logic (Cloudinary uploads)
app.use('/api/photos', photoRoutes);

// ✅ Mount image search logic (Pixabay integration)
app.use('/api/image', imageRoutes);

// ✅ Root route for testing if server is alive
app.get('/', (req, res) => {
  res.send('API is running...');
});

// ✅ Start the server on given PORT (default 5000)
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
