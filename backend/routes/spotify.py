from flask import Blueprint, request, redirect, session, jsonify
import requests
from config import config

spotify_bp = Blueprint("spotify", __name__, url_prefix="/spotify")

SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize"
SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token"


class SpotifyAuth:
    
    """
    Handles Spotify OAuth authentication and token management.
    """

    def __init__(self):
        """
        Initialize with credentials from config.
        """
        self.client_id = config.SPOTIFY_CLIENT_ID
        self.client_secret = config.SPOTIFY_CLIENT_SECRET
        self.redirect_uri = config.SPOTIFY_REDIRECT_URI
        self.scope = config.SPOTIFY_SCOPE

    def get_auth_url(self):
        
        """
        Generate Spotify authentication URL.
        """
        
        return (
            f"{SPOTIFY_AUTH_URL}?client_id={self.client_id}"
            f"&response_type=code&redirect_uri={self.redirect_uri}"
            f"&scope={self.scope}"
        )

    def request_token(self, auth_code):
        
        """
        Exchange authorization code for access token.
        """
        
        payload = {
            "grant_type": "authorization_code",
            "code": auth_code,
            "redirect_uri": self.redirect_uri,
            "client_id": self.client_id,
            "client_secret": self.client_secret,
        }

        response = requests.post(SPOTIFY_TOKEN_URL, data=payload)
        token_data = response.json()

        if "access_token" in token_data:
            session["spotify_access_token"] = token_data["access_token"]
            session["spotify_refresh_token"] = token_data.get("refresh_token")
            return token_data
        return {"error": token_data.get("error_description", "Failed to retrieve token")}

    def refresh_token(self):
        
        """
        Refresh the Spotify access token.
        """
        
        refresh_token = session.get("spotify_refresh_token")
        if not refresh_token:
            return {"error": "No refresh token found"}

        payload = {
            "grant_type": "refresh_token",
            "refresh_token": refresh_token,
            "client_id": self.client_id,
            "client_secret": self.client_secret,
        }

        response = requests.post(SPOTIFY_TOKEN_URL, data=payload)
        token_data = response.json()

        if "access_token" in token_data:
            session["spotify_access_token"] = token_data["access_token"]
            return token_data
        return {"error": token_data.get("error_description", "Failed to refresh token")}


spotify_auth = SpotifyAuth()


# Debugging Route - Get Spotify Config
@spotify_bp.route("/config", methods=["GET"])
def get_spotify_config():
    
    """
    Return Spotify config (for debugging).
    """
    
    return jsonify({
        "SPOTIFY_CLIENT_ID": config.SPOTIFY_CLIENT_ID,
        "SPOTIFY_REDIRECT_URI": config.SPOTIFY_REDIRECT_URI
    })


# Start Spotify authentication
@spotify_bp.route("/login")
def login():
    return redirect(spotify_auth.get_auth_url())


# Handle Spotify callback
@spotify_bp.route("/callback")
def callback():
    code = request.args.get("code")
    if not code:
        return jsonify({"error": "Authorization code missing"}), 400

    token_response = spotify_auth.request_token(code)
    if "error" in token_response:
        return jsonify(token_response), 400

    return jsonify({"message": "Authentication successful", "token": token_response})


# Get stored access token
@spotify_bp.route("/token")
def get_token():
    
    """
    Returns the stored access token if available.
    """
    
    access_token = session.get("spotify_access_token")
    if not access_token:
        return jsonify({"error": "No token found"}), 401

    return jsonify({"access_token": access_token})


# Refresh access token
@spotify_bp.route("/refresh")
def refresh():
    token_response = spotify_auth.refresh_token()
    if "error" in token_response:
        return jsonify(token_response), 400

    return jsonify({"message": "Token refreshed", "access_token": token_response["access_token"]})
