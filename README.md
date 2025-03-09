# Interactive Resume Portfolio

## Overview
This project is a unique, interactive 3D resume portfolio that allows users to explore a virtual environment and engage with various elements to learn about my professional experience, skills, and projects. Built using Flask (Python) for backend functionality and Three.js (JavaScript) for frontend rendering, this portfolio showcases my ability to develop immersive web applications.

## Key Features
- **3D Exploration** – Users navigate a virtual scene to discover different resume sections.
- **Spotify API Integration** – Dynamic background music that adapts to interactions.
- **Interactive Contact System** – Users can send messages via an in-world letter.
- **Project Showcase** – Previous work is displayed within 3D picture frames.
- **Smooth Loading Transitions** – Asynchronous asset loading for seamless experience.

## Technology Stack
### Frontend
- **JavaScript** (Vanilla JS for a unique experience, avoiding React/Tailwind conformity)
- **Three.js** (3D rendering and interactive environments)
- **GLSL Shaders** (Custom visual effects and dynamic lighting)
- **WebSockets** (Real-time interactions and updates)

### Backend
- **Flask** (Python web framework for API handling)
- **SQLite/PostgreSQL** (Database for storing contact form submissions)
- **Spotify API** (Integration for interactive music experience)

## Project Structure
```
resume-portfolio/
│── backend/                     # Flask Backend
│   ├── app.py                   # Main application file
│   ├── config.py                # Configuration settings (API keys, database, etc.)
│   ├── requirements.txt         # Dependencies and Python packages
│   ├── static/                  # Static assets (CSS, JavaScript, images)
│   ├── templates/               # HTML templates (for non-3D interactions)
│   ├── db.sqlite3               # SQLite database (for contact messages and logs)
│   ├── routes/                  # API Endpoints
│   │   ├── __init__.py
│   │   ├── contact.py           # Contact form API
│   │   ├── spotify.py           # Spotify API integration
│
│── frontend/                    # 3D Resume Frontend
│   ├── index.html               # Main entry point
│   ├── main.js                  # Core Three.js logic
│   ├── shaders/                 # Custom GLSL shaders for rendering effects
│   ├── styles.css               # Styling for UI elements
│   ├── assets/                  # 3D models, textures, music samples
│   ├── utils.js                 # Helper functions for Three.js interactions
│
│── README.md                    # Project documentation
│── .gitignore                    # Files to exclude from version control
│── run.sh                        # Script to launch the backend and frontend
```

## Installation & Setup
### Prerequisites
- Python 3.x
- Node.js & npm (for frontend asset management)

### Backend Setup
```sh
cd backend
python -m venv venv
source venv/bin/activate  # On Windows, use `venv\Scripts\activate`
pip install -r requirements.txt
python app.py
```

### Frontend Setup
```sh
cd frontend
python -m http.server 8000  # Serves index.html
```

### Running the Full Application
```sh
bash run.sh  # Automates launching backend and frontend
```

## Future Enhancements
- **WebGL Physics Integration** – Enhance interactivity with physics-based interactions.
- **User Authentication** – Implement login system to track visitor interactions.
- **VR Compatibility** – Expand the project for immersive virtual reality exploration.

---
This portfolio serves as an innovative way to showcase technical expertise, problem-solving skills, and creativity in web development. 🚀
