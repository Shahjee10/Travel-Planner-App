const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();
require('dotenv').config();

const cloudinary = require('../utils/cloudinary'); // Adjust path if necessary


router.get('/', async (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.status(400).json({ error: 'Missing query parameter' });
  }

  try {
    const response = await fetch(
      `https://pixabay.com/api/?key=${process.env.PIXABAY_API_KEY}&q=${encodeURIComponent(query)}&image_type=photo&category=places&per_page=3&safesearch=true`
    );

    const data = await response.json();

    if (data.hits && data.hits.length > 0) {
      // Return Pixabay URL directly without uploading to Cloudinary
      return res.json({ image: data.hits[0].largeImageURL });
    } else {
      return res.json({ image: '' });
    }
  } catch (error) {
    console.error('Error fetching image:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
