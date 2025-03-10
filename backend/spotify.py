import os
import requests
from dotenv import load_dotenv

load_dotenv()  # Load .env file

CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID")
CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRECT")

def get_spotify_token():
    url = "https://accounts.spotify.com/api/token"
    headers = {"Content-Type": "application/x-www-form-urlencoded"}
    data = {
        "grant_type": "client_credentials",
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET
    }

    response = requests.post(url, headers=headers, data=data)

    return response.json().get("access_token")


def get_tracks():
    """Fetch top 10 tracks from a Spotify playlist."""
    token = get_spotify_token()
    if not token:
        return {"error": "Failed to get Spotify token"}

    playlist_id = "6MM5yloxZErNfwXch8gTBq"  # New playlist ID
    url = f"https://api.spotify.com/v1/playlists/{playlist_id}/tracks?market=US"
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.get(url, headers=headers)
    data = response.json()

    tracks = []
    for item in data.get("items", [])[:10]:
        track = item.get("track", {})
        album = track.get("album", {})
        images = album.get("images", [])
        
        tracks.append({
            "name": track.get("name", "Unknown Track"),
            "artist": track.get("artists", [{}])[0].get("name", "Unknown Artist"),
            "album cover": images[0]["url"] if images else ""  # Get album cover
        })

    return tracks


