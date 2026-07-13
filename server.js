const express = require('express');
const path = require('path');

const app = express();

// Middleware
app.use(express.json());
app.use(express.static('public'));

// In-memory store
const links = new Map();

// Utility functions
function generateShortCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function isValidUrl(url) {
  try {
    const urlObj = new URL(url);
    // Ensure it has a valid protocol (http or https)
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

// API Routes

// POST /api/shorten - Create a shortened URL
app.post('/api/shorten', (req, res) => {
  const { url, customAlias } = req.body;

  // Validate URL
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  if (!isValidUrl(url)) {
    return res.status(400).json({ error: 'Invalid URL format' });
  }

  const shortCode = customAlias || generateShortCode();

  // Check if alias already taken
  if (links.has(shortCode)) {
    return res.status(409).json({ error: 'Alias already taken' });
  }

  // Store the link
  links.set(shortCode, {
    shortCode,
    originalUrl: url,
    createdAt: new Date().toISOString(),
    clickCount: 0,
  });

  const shortUrl = `${req.protocol}://${req.get('host')}/${shortCode}`;
  res.status(201).json({
    shortCode,
    shortUrl,
    originalUrl: url,
    createdAt: links.get(shortCode).createdAt,
  });
});

// GET /:shortCode - Redirect to original URL
app.get('/:shortCode', (req, res) => {
  const { shortCode } = req.params;

  const link = links.get(shortCode);
  if (!link) {
    return res.status(404).json({ error: 'Short URL not found' });
  }

  // Increment click count
  link.clickCount += 1;

  // Redirect
  res.redirect(302, link.originalUrl);
});

// GET /api/links - Get all links with stats
app.get('/api/links', (req, res) => {
  const allLinks = Array.from(links.values()).sort(
    (a, b) => b.clickCount - a.clickCount
  );

  res.json(allLinks);
});

// DELETE /api/links/:shortCode - Delete a link
app.delete('/api/links/:shortCode', (req, res) => {
  const { shortCode } = req.params;

  if (!links.has(shortCode)) {
    return res.status(404).json({ error: 'Short URL not found' });
  }

  links.delete(shortCode);
  res.status(204).send();
});

// Serve index.html for root path
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`URL Shortener running on http://localhost:${PORT}`);
});

module.exports = { app, links };
