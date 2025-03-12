from flask import Flask
from flask_cors import CORS
from routes.spotify import spotify_bp
import os

def create_app():
    """Factory function to create and configure the Flask app."""
    app = Flask(__name__)

    # Set secret key for session management
    app.secret_key = os.getenv("FLASK_SECRET_KEY", "default_secret_key")

    # Enable CORS to allow frontend requests
    CORS(app, supports_credentials=True)

    # Register Spotify authentication routes
    app.register_blueprint(spotify_bp)

    print("✅ Flask server is starting...")  # Debug print statement

    return app

if __name__ == "__main__":
    app = create_app()
    print("🚀 Flask server is running at http://127.0.0.1:5000")  # Confirms server is running
    app.run(debug=True)
