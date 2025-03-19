const express = require('express');
const axios = require('axios');
const querystring = require('querystring');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors({
  origin: 'http://localhost:8000', // Allow your frontend to make requests
  credentials: true
}));
app.use(express.json());

// Load configuration from .env
const client_id = process.env.SPOTIFY_CLIENT_ID;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
const redirect_uri = process.env.SPOTIFY_REDIRECT_URI; // should be "http://localhost:8888/callback"

// In-memory store for the refresh token (for demo purposes only)
let refreshTokenStore = null;

/**
 * GET /login
 * Redirects the user to Spotify's authorization page.
 */
app.get('/login', (req, res) => {
  const scopes = 'user-read-playback-state user-modify-playback-state streaming';
  const authUrl = 'https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scopes,
      redirect_uri: redirect_uri,
    });
  res.redirect(authUrl);
});

/**
 * GET /callback
 * Handles Spotify's redirect after login, exchanges the authorization code for tokens,
 * and stores the refresh token.
 */
app.get('/callback', async (req, res) => {
  const code = req.query.code || null;
  if (!code) {
    return res.status(400).send('No code provided');
  }
  try {
    const response = await axios({
      method: 'post',
      url: 'https://accounts.spotify.com/api/token',
      data: querystring.stringify({
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      }),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(client_id + ':' + client_secret).toString('base64')
      }
    });
    const access_token = response.data.access_token;
    const refresh_token = response.data.refresh_token;
    refreshTokenStore = refresh_token;
    // Redirect to your frontend with token info in the query (or set a cookie)
    res.redirect(`http://localhost:8000/?access_token=${access_token}&expires_in=${response.data.expires_in}`);
  } catch (error) {
    console.error('Error exchanging code for token:', error.response.data);
    res.status(500).send('Error exchanging code for token');
  }
});

/**
 * GET /refresh_token
 * Uses the stored refresh token to obtain a new access token.
 */
app.get('/refresh_token', async (req, res) => {
  if (!refreshTokenStore) {
    return res.status(400).json({ error: 'No refresh token available' });
  }
  try {
    const response = await axios({
      method: 'post',
      url: 'https://accounts.spotify.com/api/token',
      data: querystring.stringify({
        grant_type: 'refresh_token',
        refresh_token: refreshTokenStore,
        client_id: client_id,
        client_secret: client_secret
      }),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    const new_access_token = response.data.access_token;
    res.json({ access_token: new_access_token, expires_in: response.data.expires_in });
  } catch (error) {
    console.error('Error refreshing token:', error.response.data);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
});

const PORT = process.env.PORT || 8888;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
