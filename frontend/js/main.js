// config object for non-sensitive configuration
const config = {
  playlistUri: "https://open.spotify.com/playlist/6MM5yloxZErNfwXch8gTBq?si=a5ce1a802a5545b6", // Replace with your actual playlist URI
};

// SpotifyApp class encapsulates all Spotify Web Playback SDK functionality.
class SpotifyApp {
  constructor(playlistUri) {
    this.playlistUri = playlistUri;
    this.token = null;
    this.tokenExpiresAt = null;
    this.player = null;
    this.deviceId = null;
  }

  /**
   * Extracts the access token and its expiration timestamp from the URL hash.
   * If found, stores them in localStorage and cleans the URL.
   */
  extractTokenFromURL() {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    if (params.has("access_token") && params.has("expires_in")) {
      this.token = params.get("access_token");
      const expiresIn = parseInt(params.get("expires_in"), 10);
      this.tokenExpiresAt = Date.now() + expiresIn * 1000;
      localStorage.setItem("spotify_access_token", this.token);
      localStorage.setItem("spotify_token_expires", this.tokenExpiresAt.toString());
      // Clean URL so the token isn't visible
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
   * Checks whether the current token is expired.
   * @returns {boolean} True if token is expired.
   */
  isTokenExpired() {
    return !this.token || !this.tokenExpiresAt || Date.now() >= this.tokenExpiresAt;
  }

  /**
   * Refreshes the token by calling the backend refresh endpoint.
   * @returns {Promise<void>}
   */
  async refreshToken() {
    try {
      const response = await fetch("http://localhost:8888/refresh_token");
      const data = await response.json();
      if (response.ok && data.access_token && data.expires_in) {
        this.token = data.access_token;
        this.tokenExpiresAt = Date.now() + data.expires_in * 1000;
        localStorage.setItem("spotify_access_token", this.token);
        localStorage.setItem("spotify_token_expires", this.tokenExpiresAt.toString());
        console.log("✅ Token refreshed:", this.token);
      } else {
        console.error("Token refresh failed:", data.error);
      }
    } catch (error) {
      console.error("Error refreshing token:", error);
    }
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
      if (
        state.track_window.current_track.album &&
        state.track_window.current_track.album.images.length > 0
      ) {
        document.getElementById("album-cover").src =
          state.track_window.current_track.album.images[0].url;
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
        console.error("Failed to enable shuffle:", err);
      }
    } catch (error) {
      console.error("Error enabling shuffle:", error);
    }
  }

  /**
   * Transfers playback to the current device and starts playing the playlist.
   * If playback is paused, it resumes; if no state exists, it starts with a random offset.
   * @returns {Promise<void>}
   */
  async playPlaylist() {
    if (!this.deviceId) {
      console.error("❌ Device ID not set yet.");
      return;
    }
    // Enable shuffle first
    await this.enableShuffle();

    try {
      // Transfer playback to this device (if needed)
      await fetch("https://api.spotify.com/v1/me/player", {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${this.token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ device_ids: [this.deviceId], play: false })
      });
      console.log("✅ Playback transferred to Web SDK.");

      // Check current state: if paused, resume playback
      const state = await this.player.getCurrentState();
      if (state && state.paused) {
        console.log("Resuming playback.");
        await this.player.resume();
        return;
      }

      // If no playback state exists, start playback with a random offset.
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
   * Starts the Spotify app by extracting the token, checking for expiration,
   * refreshing if necessary, and initializing the player.
   * @returns {Promise<void>}
   */
  async start() {
    this.extractTokenFromURL();
    if (this.isTokenExpired()) {
      console.warn("Token is expired. Refreshing token...");
      await this.refreshToken();
    }
    if (this.token) {
      this.initializePlayer();
      // Hide login container if token exists
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

  // Login button event: Redirect user to our Node.js backend login endpoint
  document.getElementById("login-button").addEventListener("click", () => {
    window.location.href = "http://localhost:8888/login";
  });

  // Hide the login container by default
  document.getElementById("login-container").style.display = "none";

  // When the Play button is clicked, toggle play/pause:
  document.getElementById("play-button").addEventListener("click", async () => {
    if (!window.spotifyApp) {
      console.error("SpotifyApp instance not available.");
      return;
    }
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
  document.getElementById("next-button").addEventListener("click", () => {
    window.spotifyApp && window.spotifyApp.player.nextTrack();
  });
  document.getElementById("prev-button").addEventListener("click", () => {
    window.spotifyApp && window.spotifyApp.player.previousTrack();
  });
});

// Initialize the Spotify app when the SDK is ready
window.onSpotifyWebPlaybackSDKReady = async () => {
  console.log("🎵 Spotify Web Playback SDK is ready!");
  // Use the playlist URI from the config object.
  const playlistUri = config.playlistUri;
  window.spotifyApp = new SpotifyApp(playlistUri);
  await window.spotifyApp.start();
};
