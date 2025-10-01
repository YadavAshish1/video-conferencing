# Video Conferencing Application

A real-time video conferencing application built with React, Express, and Socket.IO that allows users to create and join virtual meeting rooms with advanced face tracking capabilities.

## Features

- Create private meeting rooms
- Join existing rooms via room ID
- Real-time video and audio communication
- Live face tracking and detection using TensorFlow.js
- Simple and intuitive user interface
- Health check endpoint for monitoring

## Tech Stack

### Frontend
- React (with Vite as build tool)
- Tailwind CSS
- Socket.IO Client
- WebRTC for peer-to-peer connections
- TensorFlow.js and Blazeface for face detection

### Backend
- Node.js
- Express
- Socket.IO for real-time communication


## Project Structure

### Frontend Structure
```
client/
├── public/              # Public assets
│   └── vite.svg         
├── src/                 # Source code
│   ├── assets/          # Static assets
│   │   └── react.svg    
│   ├── components/      # React components
│   │   ├── RoomJoin.jsx         # Room joining interface
│   │   ├── VideoConference.jsx  # Main video conference component
│   │   └── VideoPlayer.jsx      # Video player component
│   ├── hooks/           # Custom React hooks
│   │   ├── useFaceDetection.js  # Face detection using TensorFlow.js
│   │   ├── useSocket.js         # Socket.IO connection management
│   │   ├── useVideoConference.js # Video conference logic
│   │   └── useWebRTC.js         # WebRTC connection handling
│   ├── App.css          # Application styles
│   ├── App.jsx          # Main application component
│   ├── index.css        # Global styles
│   └── main.jsx         # Application entry point
├── index.html           # HTML entry point
├── package.json         # Frontend dependencies
└── vite.config.js       # Vite configuration
```

### Backend Structure
```
server/
├── server.js            # Main server file with Express and Socket.IO setup
└── package.json         # Backend dependencies
```

## Getting Started

### Prerequisites
- Node.js (v20 or higher)
- npm

### Local Development

1. Clone the repository
   ```
   git clone https://github.com/yourusername/video-conferencing.git
   cd video-conferencing
   ```

2. Install dependencies
   ```
   # Install server dependencies
   cd server
   npm install

   # Install client dependencies
   cd ../client
   npm install
   ```

3. Start the development servers
   ```
   # Start the backend server
   cd ../server
   npm start
   # The server will run on http://localhost:3001

   # In a new terminal, start the frontend
   cd ../client
   npm run dev
   # The Vite dev server will run on http://localhost:5173 by default
   ```

4. Access the application at `http://localhost:5173`

### Face Tracking Feature

The application includes real-time face tracking powered by TensorFlow.js and the Blazeface model:

- Automatically detects faces in video streams
- Works in real-time during video conferences
- Provides visual indicators around detected faces
- Optimized for performance with requestAnimationFrame
- Can be enabled/disabled through the user interface

To use face tracking:
1. Join or create a video conference room
2. The face tracking will automatically initialize when your camera is active
3. Face detection runs locally in the browser without sending face data to servers

## Deployment

This application is deployed on AWS EC2 using Docker and Kubernetes.

### Deployment URL
- [http://ec2-13-62-99-108.eu-north-1.compute.amazonaws.com/](http://ec2-13-62-99-108.eu-north-1.compute.amazonaws.com/)

### Deployment Architecture

1. **Docker Container**
   - The application is containerized using Docker
   - Both frontend and backend are packaged in a single container
   - The Dockerfile in the root directory handles the build process

2. **Kubernetes (K8s)**
   - Deployed on a Kubernetes cluster for orchestration
   - Handles scaling, load balancing, and high availability
   - Configured with health checks for automatic recovery

3. **AWS EC2**
   - Hosted on Amazon EC2 instances
   - Protected with security groups for network security

### Deployment Process

1. Build the Docker image
   ```
   docker build -t video-conferencing-app .
   ```

2. Deploy to Kubernetes
   ```
   kubectl apply -f deployment.yaml
   kubectl apply -f service.yaml
   ```

Made with ❤️ by Ashish