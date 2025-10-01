import React, { useState } from 'react';
import { VideoConference } from './components/VideoConference';
import { RoomJoin } from './components/RoomJoin';

function App() {
  const [currentRoom, setCurrentRoom] = useState(null);
  const [userId] = useState(() => `user-${Math.random().toString(36).substr(2, 9)}`);

  const handleJoinRoom = (roomId) => {
    setCurrentRoom(roomId);
  };

  const handleLeaveRoom = () => {
    setCurrentRoom(null);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {!currentRoom ? (
        <RoomJoin onJoinRoom={handleJoinRoom} />
      ) : (
        <VideoConference 
          roomId={currentRoom} 
          userId={userId}
          onLeaveRoom={handleLeaveRoom}
        />
      )}
    </div>
  );
}

export default App;