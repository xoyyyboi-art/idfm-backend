const express = require('express');
const cors = require('cors');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const app = express();
app.use(cors({ origin: ['https://id-fm.netlify.app', 'http://127.0.0.1:8888', 'http://localhost:8888'] }));
app.use(express.json());

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI || 'https://id-fm.netlify.app/edm-tracker.html';

// Exchange auth code for token
app.post('/token', async (req, res) => {
  const { code, code_verifier, redirect_uri } = req.body;
  if (!code || !code_verifier) return res.status(400).json({ error: 'Missing code or verifier' });
  const effectiveRedirect = redirect_uri || REDIRECT_URI;

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: effectiveRedirect,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code_verifier
      })
    });
    const data = await response.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Token exchange failed' });
  }
});

// Refresh token
app.post('/refresh', async (req, res) => {
  const { refresh_token } = req.body;
  if (!refresh_token) return res.status(400).json({ error: 'Missing refresh_token' });

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')
      },
      body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token })
    });
    const data = await response.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Token refresh failed' });
  }
});

// Health check
app.get('/', (req, res) => res.json({ status: 'ID.fm backend running' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`ID.fm backend running on port ${PORT}`));
