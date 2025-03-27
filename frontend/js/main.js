// config object for non-sensitive configuration
const config = {
  // Use the Spotify URI for your playlist (using the "spotify:playlist:" format for the SDK)
  playlistUri: "spotify:playlist:6MM5yloxZErNfwXch8gTBq", // Replace with your actual playlist URI
};

class SpotifyApp {
  constructor(playlistUri) {
    this.playlistUri = playlistUri;
    this.token = null;
    this.tokenExpiresAt = null;
    this.player = null;
    this.deviceId = null;
  }

  /**
   * Extracts the access token and its expiration timestamp from the URL.
   * It checks both the URL hash and the query string.
   * If found, stores them in localStorage and cleans the URL.
   */
  extractTokenFromURL() {
    // First try to get token from hash; if not present, try search string.
    let tokenString = window.location.hash.substring(1);
    if (!tokenString) {
      tokenString = window.location.search.substring(1);
    }
    const params = new URLSearchParams(tokenString);
    if (params.has("access_token") && params.has("expires_in")) {
      this.token = params.get("access_token");
      const expiresIn = parseInt(params.get("expires_in"), 10);
      this.tokenExpiresAt = Date.now() + expiresIn * 1000;
      localStorage.setItem("spotify_access_token", this.token);
      localStorage.setItem("spotify_token_expires", this.tokenExpiresAt.toString());
      // Clean URL so the token isn't visible in address bar
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
      // Update track title (p tag)
      document.getElementById("track-title").innerText = state.track_window.current_track.name;
      // Update artist name (h2 tag)
      if (state.track_window.current_track.artists && state.track_window.current_track.artists.length > 0) {
        const artists = state.track_window.current_track.artists.map(artist => artist.name).join(", ");
        document.getElementById("artist-name").innerText = artists;
      }
      // Update album name (p tag)
      if (state.track_window.current_track.album && state.track_window.current_track.album.name) {
        document.getElementById("album-name").innerText = state.track_window.current_track.album.name;
      }
      // Update album cover image
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
      const minOffset = 5;
      const maxOffset = 233;
      const randomOffset = minOffset + Math.floor(Math.random() * (maxOffset - minOffset + 1));
      // console.log(`Starting playback from random offset: ${randomOffset}`);
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
   * and initializing the player.
   * If the token is expired, the user must log in again.
   * @returns {Promise<void>}
   */
  async start() {
    this.extractTokenFromURL();
    if (this.isTokenExpired()) {
      console.warn("Token is expired. Please log in again.");
      localStorage.removeItem("spotify_access_token");
      localStorage.removeItem("spotify_token_expires");
      document.getElementById("login-container").style.display = "block";
    } else {
      this.initializePlayer();
      document.getElementById("login-container").style.display = "none";
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

  // Login button event: Redirect to our Node.js backend login endpoint
  document.getElementById("login-button").addEventListener("click", () => {
    window.location.href = "http://localhost:8887/login";
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
  document.getElementById("next-button").addEventListener("click", async () => window.spotifyApp && window.spotifyApp.player.nextTrack());
  document.getElementById("prev-button").addEventListener("click", async () => window.spotifyApp && window.spotifyApp.player.previousTrack());
});

// Initialize the Spotify app when the SDK is ready
window.onSpotifyWebPlaybackSDKReady = async () => {
  console.log("🎵 Spotify Web Playback SDK is ready!");
  const playlistUri = config.playlistUri;
  window.spotifyApp = new SpotifyApp(playlistUri);
  await window.spotifyApp.start();
};
