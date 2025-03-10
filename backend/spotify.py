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
    # print("Status Code:", response.status_code)
    # print("Response JSON:", response.json())  # Debug output

    return response.json().get("access_token")

# print(get_spotify_token())  # Test again


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

    # print("Tracks Response JSON:", data)  # Debugging print

    if "items" not in data:
        return {"error": "Spotify API did not return 'items'", "raw_response": data}

    tracks = [
        {
            "name": item["track"]["name"],
            "artist": item["track"]["artists"][0]["name"]
        }
        for item in data["items"][:10]
    ]

    return tracks


