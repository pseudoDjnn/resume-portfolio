let token = "BQCSdSP7bUN4mhjKi8cz8lFAYvpxIHmPi61NLqR8RvUDpUHv9YAJC9zXWtvVLDEBAE8KDzJJ__alFnmVMvb7hlNynQbgdmL3HSe0eoxMU7T1LQ6wFEOgffzLnnVmhk5y-7pL3lvOMhq7BzVSJu1OeYLJAYine-wdHYt8O5kJhuUT_9lhXyCSFF_d1TOvd5MdSmoNJ5EUOcf8rgGLOip1cPfk_iay5GNq8ZzyREGhnsXsgdqsDdEtSvrInM03"; // Replace with actual token
let deviceId = null;
let player;

window.onSpotifyWebPlaybackSDKReady = () => {
  player = new Spotify.Player({
    name: "Web Playback SDK Player",
    getOAuthToken: cb => cb(token),
    volume: 0.5
  });

  player.addListener("ready", ({ device_id }) => {
    console.log("Player is ready with device ID", device_id);
    deviceId = device_id;
  });

  player.addListener("player_state_changed", state => {
    if (!state) return;
    document.getElementById("track-name").innerText = state.track_window.current_track.name;
  });

  player.connect();
};

document.getElementById("activate-player").addEventListener("click", () => {
  if (player) {
    player.activateElement();
    console.log("Player activated for mobile support.");
  }
});

document.getElementById("play-button").addEventListener("click", async () => {
  if (!deviceId) {
    console.error("Device ID not set yet.");
    return;
  }

  try {
    await fetch("https://api.spotify.com/v1/me/player", {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ device_ids: [deviceId], play: false })
    });

    console.log("Playback transferred to Web SDK.");

    await fetch(`https://api.spotify.com/v1/me/player/shuffle?state=true&device_id=${deviceId}`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    console.log("Shuffle enabled!");

    const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        context_uri: "https://open.spotify.com/playlist/6MM5yloxZErNfwXch8gTBq?si=a8f8457a24214c07", // Replace with a real playlist
        offset: { position: 0 }
      })
    });

    if (response.ok) {
      console.log("Playback started!");
    } else {
      console.error("Failed to start playback", await response.json());
    }
  } catch (error) {
    console.error("Error:", error);
  }
});

document.getElementById("pause-button").addEventListener("click", () => player.pause());
document.getElementById("next-button").addEventListener("click", () => player.nextTrack());
document.getElementById("prev-button").addEventListener("click", () => player.previousTrack());
