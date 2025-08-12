const axios = require('axios');

async function testPixabayCloudinary() {
  try {
    const query = 'New York';
    const res = await axios.get(`http://localhost:5000/api/image?q=${encodeURIComponent(query)}`);
    console.log('Response data:', res.data);

    if (res.data.image) {
      console.log('Permanent image URL:', res.data.image);
    } else {
      console.log('No image returned.');
    }
  } catch (error) {
    if (error.response) {
      console.error('Test failed with status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else {
      console.error('Test failed:', error.message);
    }
  }
}

testPixabayCloudinary();
