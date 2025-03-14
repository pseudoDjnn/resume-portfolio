import os
from flask import Flask
from flask_session import Session
from routes.spotify import spotify_bp

app = Flask(__name__)

# Flask-Session Config (Move to .env if needed)
app.config["SECRET_KEY"] = os.getenv("FLASK_SECRET_KEY", "default_secret_key")
app.config["SESSION_TYPE"] = "filesystem"  # Use Redis in production
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_USE_SIGNER"] = True
app.config["SESSION_FILE_DIR"] = "./flask_session"

Session(app)

# Register Blueprints
app.register_blueprint(spotify_bp)

if __name__ == "__main__":
    app.run(debug=True)
