import { SpotifyAuth } from "./SpotifyAuth.js";
import { SpotifyPlayer } from "./SpotifyPlayer.js";

class App {
  constructor() {
    this.auth = new SpotifyAuth(
      "your_spotify_client_id",
      "http://localhost:5000",
      "user-read-playback-state user-modify-playback-state streaming"
    );

    this.token = this.auth.getToken();
    if (!this.token) {
      this.auth.redirectToSpotify();
    } else {
      this.player = new SpotifyPlayer(this.token);
      this.player.loadPlayer();
    }
  }
}

export default App;
