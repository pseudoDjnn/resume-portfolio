from flask import Blueprint, request, session, jsonify, redirect, url_for
import requests
import time
import os

spotify_bp = Blueprint("spotify", __name__)

# Spotify API URLs
SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize"
SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token"
SPOTIFY_API_BASE = "https://api.spotify.com/v1/"

# Load environment variables securely
SPOTIFY_CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID")
SPOTIFY_CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET")
SPOTIFY_REDIRECT_URI = os.getenv("SPOTIFY_REDIRECT_URI", "http://localhost:5000/spotify/callback")
SPOTIFY_SCOPE = os.getenv("SPOTIFY_SCOPE", "user-read-private user-read-email")  # Ensure required scopes are present


@spotify_bp.route("/spotify/login")
def spotify_login():
    """
    Redirects the user to Spotify authorization URL.
    """
    session["next_url"] = request.args.get("next", url_for("spotify.spotify_me"))  # Store next URL for redirection

    auth_params = {
        "client_id": SPOTIFY_CLIENT_ID,
        "response_type": "code",
        "redirect_uri": SPOTIFY_REDIRECT_URI,
        "scope": SPOTIFY_SCOPE,
    }
    auth_url = f"{SPOTIFY_AUTH_URL}?{'&'.join([f'{key}={value}' for key, value in auth_params.items()])}"
    return redirect(auth_url)


@spotify_bp.route("/spotify/callback")
def spotify_callback():
    """
    Handles Spotify OAuth callback and exchanges the authorization code for an access token.
    """
    code = request.args.get("code")
    if not code:
        return jsonify({"error": "Authorization code missing"}), 400

    token_data = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": SPOTIFY_REDIRECT_URI,
        "client_id": SPOTIFY_CLIENT_ID,
        "client_secret": SPOTIFY_CLIENT_SECRET,
    }

    response = requests.post(SPOTIFY_TOKEN_URL, data=token_data)
    token_json = response.json()

    if "access_token" not in token_json:
        return jsonify({"error": "Failed to retrieve access token"}), 400

    # Store token and expiration in a server-side session
    session["access_token"] = token_json["access_token"]
    session["refresh_token"] = token_json.get("refresh_token")  # May not always be provided
    session["expires_at"] = time.time() + token_json["expires_in"]

    next_url = session.pop("next_url", url_for("spotify.spotify_me"))  # Retrieve and remove next_url
    return redirect(next_url)


@spotify_bp.route("/spotify/token")
def get_token():
    """
    Retrieves the stored access token if valid, otherwise refreshes it.
    """
    if "access_token" in session and time.time() < session.get("expires_at", 0):
        return jsonify({"access_token": session["access_token"]})

    if "refresh_token" not in session:
        return jsonify({"error": "No access token found in session"}), 401

    # Refresh the token
    refresh_data = {
        "grant_type": "refresh_token",
        "refresh_token": session["refresh_token"],
        "client_id": SPOTIFY_CLIENT_ID,
        "client_secret": SPOTIFY_CLIENT_SECRET,
    }

    response = requests.post(SPOTIFY_TOKEN_URL, data=refresh_data)
    token_json = response.json()

    if "access_token" not in token_json:
        # If refresh fails, clear session and force login again
        session.clear()
        return jsonify({"error": "Refresh token expired or invalid. Please re-authenticate."}), 401

    # Update session with new token
    session["access_token"] = token_json["access_token"]
    session["expires_at"] = time.time() + token_json.get("expires_in", 3600)

    return jsonify({"access_token": session["access_token"]})


@spotify_bp.route("/spotify/me")
def spotify_me():
    """
    Fetches Spotify user profile using the stored access token.
    """
    if "access_token" not in session:
        return jsonify({"error": "User not authenticated"}), 401

    headers = {"Authorization": f"Bearer {session['access_token']}"}
    response = requests.get(f"{SPOTIFY_API_BASE}me", headers=headers)

    if response.status_code != 200:
        return jsonify({"error": "Failed to fetch user data"}), response.status_code

    return jsonify(response.json())
