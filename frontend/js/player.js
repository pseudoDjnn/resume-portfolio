class SpotifyPlayer {
  constructor() {
    this.player = null;
    this.accessToken = "";
    this.deviceId = null;
  }

  async init() {
    await this.getAccessToken();
    this.loadSpotifySDK();
  }

  async getAccessToken() {
    try {
      const response = await fetch("http://127.0.0.1:5000/spotify/token");
      const data = await response.json();
      this.accessToken = data.token;
    } catch (e) {
      console.error("Error fetching token:", e)
    }
  }

  loadSpotifySDK() {
    window.onSpotifyWebPlaybackSDKReady = () => {
      this.player = new Spotify.Player({
        name: "Three.js Music Player",
        getOAuthToken: cb => cb(this.accessToken),
        volume: 0.5
      });

      this.player.addListener("ready", ({ device_id }) => {
        console.log("Ready with Device ID", device_id);
        this.deviceId = device_id;
        this.playPlaylist();
      });

      this.player.connect();
    };
  }

  async playPlaylist() {
    const playlistURI = "spotify:playlist:YOUR_PLAYLIST_ID"; // Replace with your playlist ID

    await fetch(`https://api.spotify.com/v1/me/player/play`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${this.accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        context_uri: playlistURI,
        shuffle: true
      })
    });
  }

  async playPause() {
    const state = await fetch(`https://api.spotify.com/v1/me/player`, {
      headers: { "Authorization": `Bearer ${this.accessToken}` }
    }).then(res => res.json());

    const method = state.is_playing ? "pause" : "play";

    await fetch(`https://api.spotify.com/v1/me/player/${method}`, {
      method: "PUT",
      headers: { "Authorization": `Bearer ${this.accessToken}` }
    });
  }
}

const spotifyPlayer = new SpotifyPlayer();
spotifyPlayer.init();
