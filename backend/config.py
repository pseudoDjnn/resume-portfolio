import os
from dotenv import load_dotenv

class Config:
    
    """
    Configuration class for loading environment variables.
    """
    
    def __init__(self):
        load_dotenv()  # Load environment variables from .env file
        self.SPOTIFY_CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID")
        self.SPOTIFY_CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET")
        self.FLASK_SECRET_KEY = os.getenv("FLASK_SECRET_KEY", "default_secret_key")
        self.SPOTIFY_REDIRECT_URI = os.getenv("SPOTIFY_REDIRECT_URI", "http://localhost:5000/spotify/callback")
        self.SPOTIFY_SCOPE = os.getenv("SPOTIFY_SCOPE")
        
        
        self.SESSION_TYPE = "filesystem"
        self.SESSION_PERMANENT = False
        self.SESSION_USE_SIGNER = True
        
        self.SESSION_FILE_DIR = os.getenv("SESSION_FILE_DIR", "./flask_session")
        

    def get_config(self):
        
        """
        Return a dictionary of all configuration values.
        """
        
        return {
            "SPOTIFY_CLIENT_ID": self.SPOTIFY_CLIENT_ID,
            "SPOTIFY_CLIENT_SECRET": self.SPOTIFY_CLIENT_SECRET,
            "FLASK_SECRET_KEY": self.FLASK_SECRET_KEY,
            "SPOTIFY_REDIRECT_URI": self.SPOTIFY_REDIRECT_URI,
            "SPOTIFY_SCOPE": self.SPOTIFY_SCOPE,
            "SESSION_TYPE": self.SESSION_TYPE,
            "SESSION_PERMANENT": self.SESSION_PERMANENT,
            "SESSION_USE_SIGNER": self.SESSION_USE_SIGNER,
            "SESSION_FILE_DIR": self.SESSION_FILE_DIR
        }

config = Config()
