import os
import requests
import base64
from flask import Flask, request, redirect, jsonify, session, render_template
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

class Config:
    """App configuration class."""
    CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID")
    CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET")
    REDIRECT_URI = os.getenv("REDIRECT_URI")
    SECRET_KEY = os.getenv("SECRET_KEY")
    SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize"
    SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token"
    SPOTIFY_API_BASE_URL = "https://api.spotify.com/v1/"

class SpotifyAuth:
    """Handles Spotify Authentication."""
    def __init__(self):
        self.client_id = Config.CLIENT_ID
        self.client_secret = Config.CLIENT_SECRET
        self.redirect_uri = Config.REDIRECT_URI

    def get_auth_url(self):
        """Generate Spotify login URL."""
        scope = "user-read-playback-state user-modify-playback-state streaming"
        return f"{Config.SPOTIFY_AUTH_URL}?client_id={self.client_id}&response_type=code&redirect_uri={self.redirect_uri}&scope={scope}"

    def get_token(self, code):
        """Exchange auth code for access token."""
        auth_header = base64.b64encode(f"{self.client_id}:{self.client_secret}".encode()).decode()
        response = requests.post(
            Config.SPOTIFY_TOKEN_URL,
            headers={"Authorization": f"Basic {auth_header}", "Content-Type": "application/x-www-form-urlencoded"},
            data={"grant_type": "authorization_code", "code": code, "redirect_uri": self.redirect_uri}
        ).json()
        return response.get("access_token")

class SpotifyAPI:
    """Handles API calls to Spotify."""
    def __init__(self, access_token):
        self.access_token = access_token
        self.headers = {"Authorization": f"Bearer {self.access_token}"}

    def play(self):
        """Play the currently active Spotify playback."""
        return requests.put(f"{Config.SPOTIFY_API_BASE_URL}me/player/play", headers=self.headers).json()

    def pause(self):
        """Pause the currently active Spotify playback."""
        return requests.put(f"{Config.SPOTIFY_API_BASE_URL}me/player/pause", headers=self.headers).json()

# Initialize Flask app
app = Flask(__name__)
app.secret_key = Config.SECRET_KEY
spotify_auth = SpotifyAuth()

@app.route("/login")
def login():
    return redirect(spotify_auth.get_auth_url())

@app.route("/callback")
def callback():
    code = request.args.get("code")
    access_token = spotify_auth.get_token(code)
    session["access_token"] = access_token
    return redirect("/")

@app.route("/spotify/token")
def get_token():
    return jsonify({"access_token": session.get("access_token", None)})

@app.route("/spotify/play")
def play():
    if "access_token" in session:
        spotify = SpotifyAPI(session["access_token"])
        return jsonify(spotify.play())
    return jsonify({"error": "Unauthorized"}), 401

@app.route("/spotify/pause")
def pause():
    if "access_token" in session:
        spotify = SpotifyAPI(session["access_token"])
        return jsonify(spotify.pause())
    return jsonify({"error": "Unauthorized"}), 401

@app.route("/")
def index():
    return render_template("index.html")

if __name__ == "__main__":
    app.run(debug=True)
