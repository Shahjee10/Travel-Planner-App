const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const photoRoutes = require('./routes/photoRoutes');

dotenv.config();

const app = express();

connectDB();

app.use(express.json());

// User routes
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/protected', require('./routes/protectedRoutes'));
app.use('/api/trips', require('./routes/tripRoutes'));
app.use('/api/trips', photoRoutes);




// Root endpoint for testing
app.get('/', (req, res) => {
  res.send('API is running...');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
