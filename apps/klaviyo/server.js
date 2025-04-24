const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for your Contentful app's origin
app.use(cors({
  origin: process.env.CONTENTFUL_APP_HOST || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());

// Proxy endpoint for Klaviyo API calls
app.post('/api/klaviyo/proxy', async (req, res) => {
  try {
    const { endpoint, method, headers, data } = req.body;
    
    // Add your Klaviyo API key from environment variables
    const klaviyoHeaders = {
      ...headers,
      'Authorization': `Klaviyo-API-Key ${process.env.KLAVIYO_API_KEY}`,
      'Content-Type': 'application/vnd.api+json',
      'revision': '2025-04-15',
    };
    
    const response = await axios({
      method: method || 'GET',
      url: `https://a.klaviyo.com/api${endpoint}`,
      headers: klaviyoHeaders,
      data: data || null
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Proxy error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data || error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
}); 