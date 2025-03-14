import { SpotifyAuth } from "./SpotifyAuth.js";

export class SpotifyPlayer {
  constructor(playlistId) {
    this.token = null;
    this.player = null;
    this.playlistId = playlistId;
  }

  async init() {
    this.token = await SpotifyAuth.getAccessToken();
    if (!this.token) {
      console.error("No access token found. Cannot initialize player.");
      return;
    }

    window.onSpotifyWebPlaybackSDKReady = () => {
      this.player = new Spotify.Player({
        name: "My Spotify Player",
        getOAuthToken: cb => cb(this.token),
        volume: 0.5,
      });

      this.player.addListener("ready", async ({ device_id }) => {
        console.log("Player ready with Device ID", device_id);
        await this.playPlaylist(device_id);
      });

      this.player.connect().then(success => {
        if (success) {
          console.log("Spotify Player connected!");
        }
      });

      this.player.addListener("not_ready", ({ device_id }) => {
        console.log("Player went offline", device_id);
      });

      this.player.addListener("initialization_error", ({ message }) => {
        console.error("Initialization error:", message);
      });

      this.player.addListener("authentication_error", ({ message }) => {
        console.error("Authentication error:", message);
      });
    };

    this.loadSDK();
  }

  loadSDK() {
    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    document.body.appendChild(script);
  }

  async playPlaylist(device_id) {
    const playEndpoint = `https://api.spotify.com/v1/me/player/play?device_id=${device_id}`;

    const response = await fetch(playEndpoint, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        context_uri: `spotify:playlist:${this.playlistId}`,
        offset: { position: 0 },
        position_ms: 0,
      }),
    });

    if (response.ok) {
      console.log("Playlist started playing.");
    } else {
      console.error("Failed to play playlist:", await response.json());
    }
  }
}
