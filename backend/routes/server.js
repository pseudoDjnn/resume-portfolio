const express = require('express');
const axios = require('axios');
const querystring = require('querystring');
const cors = require('cors');
require('dotenv').config({ path: '../.env' });

const app = express();
app.use(cors({
  origin: 'http://localhost:8000', // Allow your frontend to make requests
  credentials: true
}));
app.use(express.json());

// Load configuration from .env
const client_id = process.env.SPOTIFY_CLIENT_ID;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
const redirect_uri = process.env.SPOTIFY_REDIRECT_URI;
console.log("Client ID:", client_id);
console.log("Redirect URI:", redirect_uri);

// In-memory store for the refresh token (demo purposes only)
let refreshTokenStore = null;

// In-memory storage for the current access token and expiration
let currentAccessToken = null;
let currentTokenExpiresAt = null;
let refreshTimeoutId = null;

/**
 * Schedules an automatic token refresh 60 seconds before expiration.
 * @param {number} expiresInSeconds - The token's lifetime in seconds.
 */
function scheduleAutoRefresh(expiresInSeconds) {
  const delay = (expiresInSeconds * 1000) - 60000; // refresh 60 seconds before expiration
  console.log(`Scheduling auto-refresh in ${Math.floor(delay / 1000)} seconds.`);
  refreshTimeoutId = setTimeout(autoRefreshToken, delay);
}

/**
 * Automatically refreshes the access token using the stored refresh token.
 */
async function autoRefreshToken() {
  if (!refreshTokenStore) {
    console.error("No refresh token stored; cannot auto-refresh.");
    return;
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
    currentAccessToken = response.data.access_token;
    const expiresIn = response.data.expires_in;
    currentTokenExpiresAt = Date.now() + expiresIn * 1000;
    console.log("Auto-refreshed token:", currentAccessToken);
    // Schedule next refresh
    scheduleAutoRefresh(expiresIn);
  } catch (error) {
    console.error("Error auto-refreshing token:", error.response ? error.response.data : error);
  }
}

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
 * stores the refresh token, and schedules automatic token refreshing.
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
    refreshTokenStore = refresh_token; // store refresh token for future use
    currentAccessToken = access_token;
    const expiresIn = response.data.expires_in;
    currentTokenExpiresAt = Date.now() + expiresIn * 1000;
    // Schedule automatic refresh
    scheduleAutoRefresh(expiresIn);
    // Redirect to frontend with token info in query parameters
    res.redirect(`http://localhost:8000/?access_token=${access_token}&expires_in=${expiresIn}`);
  } catch (error) {
    console.error('Error exchanging code for token:', error.response ? error.response.data : error);
    res.status(500).send('Error exchanging code for token');
  }
});

/**
 * GET /refresh_token
 * Returns the current (auto-refreshed) access token.
 */
app.get('/refresh_token', (req, res) => {
  if (!currentAccessToken) {
    return res.status(400).json({ error: 'No access token available' });
  }
  res.json({ access_token: currentAccessToken, expires_in: Math.floor((currentTokenExpiresAt - Date.now()) / 1000) });
});

const PORT = process.env.PORT || 8888;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
