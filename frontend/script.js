async function fetchTracks() {
  try {
    const res = await fetch("http://127.0.0.1:5000/spotify/tracks");
    const tracks = await res.json();
    // console.log(tracks)

    const playerContainer = document.getElementByID("music-player");
    playerContainer.innerHTML = "";  // Clear the exisiting data

    tracks.forEach((tracks, index) => {
      const trackElement = document.createElement("div");

      trackElement.innerHTML = `
      <img src="${track.album_cover}" alt="Album Cover" class="album-cover">
      <div class="track-info">
        <h3>${track.name}</h3>
        <p>${track.artist}</p>
      </div>
      `;

      playerContainer.appendChild(trackElement);

    });
  } catch (e) {
    console.error("Error fectching tracks", e);
  }
}