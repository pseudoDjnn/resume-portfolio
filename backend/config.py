import os
from dotenv import load_dotenv

# Load enviornment variables
load_dotenv()

class Config:
  SPOTIFY_CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID")
  SPOTIFY_CLIENT_SECRECT = os.getenv("SPOTIFY_CLIENT_SECRECT")
  SPOTIFY_REDIRECT_URI = os.getenv("SPOTIFY_REDIRECT_URI")