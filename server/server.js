const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, './server/client/dist')));



function generateRoomId(length = 6) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

// Storing active rooms
const rooms = new Map();

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.post('/create-room', (req, res) => {
   const roomId = generateRoomId(6);;
  rooms.set(roomId, {
    id: roomId,
    participants: new Map(),
    createdAt: new Date()
  });
  
  res.json({ roomId, success: true });
});

app.get('/room/:roomId', (req, res) => {
  const roomId = req.params.roomId;
  const room = rooms.get(roomId);
  
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  
  res.json({ 
    roomId: room.id, 
    participantCount: room.participants.size,
    exists: true 
  });
});

// Socket.io connection 
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-room', (roomId, userId) => {
    if (!rooms.has(roomId)) {
      socket.emit('error', 'Room does not exist');
      return;
    }

    const room = rooms.get(roomId);
    room.participants.set(userId, socket.id);
    socket.join(roomId);

    socket.to(roomId).emit('user-connected', userId);
    console.log(`User ${userId} joined room ${roomId}`);

    // Send current participants to the new user
    const participants = Array.from(room.participants.keys()).filter(id => id !== userId);
    socket.emit('current-participants', participants);
  });

  socket.on('webrtc-offer', (data) => {
    socket.to(data.target).emit('webrtc-offer', {
      offer: data.offer,
      sender: data.sender
    });
  });

  socket.on('webrtc-answer', (data) => {
    socket.to(data.target).emit('webrtc-answer', {
      answer: data.answer,
      sender: data.sender
    });
  });

  socket.on('webrtc-ice-candidate', (data) => {
    socket.to(data.target).emit('webrtc-ice-candidate', data);
  });

  socket.on('face-detection-data', (data) => {
    socket.to(data.roomId).emit('face-detection-update', {
      userId: data.userId,
      faces: data.faces
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Remove user from all rooms
    for (const [roomId, room] of rooms.entries()) {
      for (const [userId, socketId] of room.participants.entries()) {
        if (socketId === socket.id) {
          room.participants.delete(userId);
          socket.to(roomId).emit('user-disconnected', userId);
          
          // Cleaning up empty rooms
          if (room.participants.size === 0) {
            rooms.delete(roomId);
          }
          break;
        }
      }
    }
  });
});

app.use((req, res) => {
  res.sendFile(path.join(__dirname, './server/client/dist/index.html'));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});