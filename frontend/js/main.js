/**
 * SpotifyApp class encapsulates all functionality for the Spotify Web Playback SDK.
 * It handles token extraction (Implicit Grant Flow), player initialization,
 * auto-enabling shuffle, and starting playback of a given playlist.
 */
class SpotifyApp {
  /**
   * Creates a new SpotifyApp instance.
   * @param {string} playlistUri - The Spotify URI of the playlist to play.
   */
  constructor(playlistUri) {
    this.playlistUri = playlistUri;
    this.token = null;
    this.tokenExpiresAt = null;
    this.player = null;
    this.deviceId = null;
  }

  /**
   * Extracts the access token and expiration time from the URL hash and stores them in localStorage.
   */
  extractTokenFromURL() {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    if (params.has("access_token")) {
      this.token = params.get("access_token");
      // 'expires_in' is provided in seconds
      const expiresIn = parseInt(params.get("expires_in") || "3600", 10);
      // Set expiration timestamp (in milliseconds)
      this.tokenExpiresAt = Date.now() + expiresIn * 1000;
      localStorage.setItem("spotify_access_token", this.token);
      localStorage.setItem("spotify_token_expires", this.tokenExpiresAt.toString());
      // Clean the URL so the token isn’t visible
      window.history.replaceState({}, document.title, "/");
      console.log("✅ Token extracted from URL:", this.token);
    } else {
      this.token = localStorage.getItem("spotify_access_token");
      const expires = localStorage.getItem("spotify_token_expires");
      this.tokenExpiresAt = expires ? parseInt(expires, 10) : null;
      console.log("✅ Token loaded from localStorage:", this.token);
    }
  }

  /**
   * Checks if the token is expired.
   * @returns {boolean} - True if the token is expired, false otherwise.
   */
  isTokenExpired() {
    return !this.token || !this.tokenExpiresAt || Date.now() >= this.tokenExpiresAt;
  }

  /**
   * Initializes the Spotify Web Playback SDK.
   */
  initializePlayer() {
    if (!this.token) {
      console.error("❌ No access token found. Cannot initialize player.");
      return;
    }

    this.player = new Spotify.Player({
      name: "Web Playback SDK Player",
      getOAuthToken: cb => { cb(this.token); },
      volume: 0.5
    });

    this.player.addListener("ready", ({ device_id }) => {
      console.log("✅ Player ready with Device ID:", device_id);
      this.deviceId = device_id;
    });

    this.player.addListener("player_state_changed", state => {
      if (!state) return;
      document.getElementById("track-title").innerText = state.track_window.current_track.name;
      if (state.track_window.current_track.album && state.track_window.current_track.album.images.length > 0) {
        document.getElementById("album-cover").src = state.track_window.current_track.album.images[0].url;
      }
    });

    this.player.addListener("authentication_error", ({ message }) => {
      console.error("⚠️ Authentication error:", message);
    });

    this.player.connect();
  }

  /**
   * Enables shuffle mode via the Spotify Web API.
   * @returns {Promise<void>}
   */
  async enableShuffle() {
    if (!this.deviceId) {
      console.error("❌ Device ID not set yet. Cannot enable shuffle.");
      return;
    }
    try {
      const response = await fetch("https://api.spotify.com/v1/me/player/shuffle?state=true", {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${this.token}`,
          "Content-Type": "application/json"
        }
      });
      if (response.ok) {
        console.log("✅ Shuffle enabled.");
      } else {
        const err = await response.json();
        // Optionally ignore error if reason is NO_ACTIVE_DEVICE
        if (err.reason === "NO_ACTIVE_DEVICE") {
          console.warn("Shuffle not enabled because no active device; this can occur transiently.");
        } else {
          console.error("Failed to enable shuffle:", err);
        }
      }
    } catch (error) {
      console.error("Error enabling shuffle:", error);
    }
  }


  /**
   * Transfers playback to the Web SDK device and starts playing the specified playlist.
   * If no playback state exists, it starts at a random offset.
   * @returns {Promise<void>}
   */
  async playPlaylist() {
    if (!this.deviceId) {
      console.error("❌ Device ID not set yet.");
      return;
    }

    // Enable shuffle mode first
    await this.enableShuffle();

    try {
      // Transfer playback to the Web SDK device (optional step)
      await fetch("https://api.spotify.com/v1/me/player", {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${this.token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ device_ids: [this.deviceId], play: false })
      });
      console.log("✅ Playback transferred to Web SDK.");

      // Check current state; if paused, resume instead of restarting from offset 0
      const state = await this.player.getCurrentState();
      if (state && state.paused) {
        console.log("Resuming playback from current position.");
        await this.player.resume();
        return;
      }

      // If no state or starting fresh, use a random offset to start playback
      const maxOffset = 20; // Adjust based on your playlist length
      const randomOffset = Math.floor(Math.random() * maxOffset);
      console.log(`Starting playback from random offset: ${randomOffset}`);

      const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${this.deviceId}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${this.token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          context_uri: this.playlistUri,
          offset: { position: randomOffset }
        })
      });
      if (response.ok) {
        console.log("✅ Playback started with shuffled playlist.");
      } else {
        console.error("Failed to start playback:", await response.json());
      }
    } catch (error) {
      console.error("Error starting playlist playback:", error);
    }
  }

  /**
   * Starts the Spotify app by extracting the token, checking expiration, and initializing the player.
   * @returns {Promise<void>}
   */
  async start() {
    this.extractTokenFromURL();
    if (this.isTokenExpired()) {
      console.error("❌ Token is expired. Please log in again.");
      // Clear expired token and show login container
      localStorage.removeItem("spotify_access_token");
      localStorage.removeItem("spotify_token_expires");
      document.getElementById("login-container").style.display = "block";
      return;
    }
    if (this.token) {
      this.initializePlayer();
      document.getElementById("login-container").style.display = "none";
    } else {
      console.error("❌ No access token available. Please log in.");
      document.getElementById("login-container").style.display = "block";
    }
  }
}

// ---------------------
// DOM Event Listeners (wrapped in DOMContentLoaded)
// ---------------------
document.addEventListener("DOMContentLoaded", () => {
  // Toggle the player card's collapse/expand state
  document.getElementById("toggle-player").addEventListener("click", () => {
    const card = document.getElementById("player-card");
    card.classList.toggle("collapsed");
    card.classList.toggle("expanded");
  });

  // Login button event: Redirect user to Spotify login if no token is available
  document.getElementById("login-button").addEventListener("click", () => {
    const clientId = "0fc30e3c75bf4435b7d94bd90677a159"; // Replace with your actual Spotify Client ID
    const redirectUri = "http://localhost:8000/"; // Must match your Spotify app settings
    const scopes = encodeURIComponent("user-read-playback-state user-modify-playback-state streaming");
    const authUrl = `https://accounts.spotify.com/authorize?client_id=YOUR_CLIENT_ID&response_type=token&redirect_uri=${encodeURIComponent("http://localhost:8000/")}&scope=${scopes}`;
    window.location.href = authUrl;
  });

  // Hide the login container by default
  document.getElementById("login-container").style.display = "none";

  // When the Play button is clicked, toggle play/pause:
  document.getElementById("play-button").addEventListener("click", async () => {
    if (!window.spotifyApp) {
      console.error("SpotifyApp instance not available.");
      return;
    }
    // Check current state: if paused, resume; if playing, pause; if no state, start playlist.
    const state = await window.spotifyApp.player.getCurrentState();
    if (state && state.paused) {
      console.log("Resuming playback.");
      await window.spotifyApp.player.resume();
    } else if (state && !state.paused) {
      console.log("Pausing playback.");
      await window.spotifyApp.player.pause();
    } else {
      await window.spotifyApp.playPlaylist();
    }
  });

  // Basic controls for Next and Previous tracks
  document.getElementById("next-button").addEventListener("click", () => window.spotifyApp && window.spotifyApp.player.nextTrack());
  document.getElementById("prev-button").addEventListener("click", () => window.spotifyApp && window.spotifyApp.player.previousTrack());
});

// Initialize the Spotify app when the SDK is ready
window.onSpotifyWebPlaybackSDKReady = async () => {
  console.log("🎵 Spotify Web Playback SDK is ready!");
  // Replace with your actual playlist URI, e.g., "spotify:playlist:YOUR_VALID_PLAYLIST_ID"
  const playlistUri = "https://open.spotify.com/playlist/6MM5yloxZErNfwXch8gTBq?si=eb54f64a6d9a4c3d";
  window.spotifyApp = new SpotifyApp(playlistUri);
  await window.spotifyApp.start();
};
