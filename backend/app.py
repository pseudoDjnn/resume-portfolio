from flask import Flask
from flask_cors import CORS
from flask_session import Session
from routes.spotify import spotify_bp
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app, origins=["http://localhost:8000"], supports_credentials=True)

# Flask-Session Config
app.config["SECRET_KEY"] = os.getenv("FLASK_SECRET_KEY", "default_secret_key")
app.config["SESSION_TYPE"] = "filesystem"  # Change to "redis" in production
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_USE_SIGNER"] = True
app.config["SESSION_FILE_DIR"] = "./flask_session"

Session(app)

# Register Spotify Blueprint
app.register_blueprint(spotify_bp)

if __name__ == "__main__":
    app.run(debug=True)
