export class SpotifyAuth {
  static async getAccessToken() {
    try {
      const response = await fetch("http://localhost:5000/spotify/token");
      const data = await response.json();
      if (data.access_token) {
        console.log("Spotify Access Token:", data.access_token);
        return data.access_token;
      } else {
        console.error("Failed to retrieve access token:", data);
        return null;
      }
    } catch (error) {
      console.error("Error fetching token:", error);
      return null;
    }
  }
}
