from flask import Flask, jsonify
from flask_cors import CORS
from spotify import get_tracks



app = Flask(__name__)
CORS(app)

@app.route('/spotify/tracks')
def fetch_tracks():
  tracks = get_tracks()
  
  # Print track data in the console
  print("\n🎵 Spotify Tracks Reterieved:")
  for track in tracks:
    print(f"- {track['name']} by {track['artist']}")
    
  return jsonify(tracks)

if __name__ == '__main__':
  app.run(debug=True, port=5000)