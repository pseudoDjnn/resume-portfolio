import os
from dotenv import load_dotenv

class Config:
    """Configuration class for loading environment variables."""
    
    def __init__(self):
        load_dotenv()  # Load environment variables from .env file
        self.SPOTIFY_CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID")
        self.SPOTIFY_CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET")
        self.FLASK_SECRET_KEY = os.getenv("FLASK_SECRET_KEY", "default_secret_key")
        self.SPOTIFY_REDIRECT_URI = os.getenv("SPOTIFY_REDIRECT_URI", "http://127.0.0.1:5000/spotify/callback")

    def get_config(self):
        """Return a dictionary of all configuration values."""
        return {
            "SPOTIFY_CLIENT_ID": self.SPOTIFY_CLIENT_ID,
            "SPOTIFY_CLIENT_SECRET": self.SPOTIFY_CLIENT_SECRET,
            "FLASK_SECRET_KEY": self.FLASK_SECRET_KEY,
            "SPOTIFY_REDIRECT_URI": self.SPOTIFY_REDIRECT_URI,
        }

# ✅ Create an instance of Config
config = Config()
