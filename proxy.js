// proxy.js
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch'); // if needed

const app = express();
const PORT = 3001; // or whatever

app.use(cors());

app.get('/api/book/:subject', async (req, res) => {
  const { subject } = req.params;
  try {
    const response = await fetch(`https://openlibrary.org/subjects/${subject}.json`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching from OpenLibrary:', error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server running at http://localhost:${PORT}`);
});
