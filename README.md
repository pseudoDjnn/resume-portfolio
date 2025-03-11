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
/my-project
│── backend/                     
│   ├── venv/                    # Python virtual environment
│   ├── .env                     # Environment Variables (Spotify API keys, secrets)
│   ├── app.py                   # Flask app entry point
│   ├── config.py                # Configuration settings
│   ├── requirements.txt         # Python dependencies
│   ├── routes/                  
│   │   ├── __init__.py
│   │   ├── spotify.py           # Handles Spotify API authentication
│   ├── static/                  
│
│── frontend/                    
│   ├── index.html               
│   ├── js/                      
│   │   ├── player.js            # OOP Spotify Player Logic
│   │   ├── threeApp.js          # Three.js Visualizer Logic
│   │   ├── shaders.js           # GLSL Shader Loader
│   ├── shaders/                 # Custom Shader File
│   │   ├── fragment.glsl        # Fragment Shader
│   │   ├── vertex.glsl          # Vertex Shader
│   ├── styles/                  # Styling
│   │   ├── style.css            # UI Design
│   ├── assets/                  # 3D models, textures, music samples, etc...
│   ├── utils/                   # Utiliy scripts for reusable functions
│   │   ├── controls.js          # Custom camera & input controls for Three.js
│
│── README.md                    # Documentation
│── .gitignore                   # Ignore unnecessary files
│── run.sh                       # Script to launch backend and frontend

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
