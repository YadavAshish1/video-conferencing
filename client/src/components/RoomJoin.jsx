import React, { useState, useEffect } from 'react';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://ec2-13-62-99-108.eu-north-1.compute.amazonaws.com';

export const RoomJoin = ({ onJoinRoom }) => {
  const [roomId, setRoomId] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    // Check for room ID in URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');
    if (roomParam) {
      setRoomId(roomParam);
    }
  }, []);

  const createRoom = async () => {
    setIsCreating(true);
    try {
      const response = await fetch(`${SERVER_URL}/create-room`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      
      if (data.success) {
        setRoomId(data.roomId);
        // Updating URL without page reloading
        window.history.replaceState({}, '', `?room=${data.roomId}`);
        onJoinRoom(data.roomId);
      }
    } catch (error) {
      console.error('Error creating room:', error);
      alert('Failed to create room. Please check if server is running.');
    } finally {
      setIsCreating(false);
    }
  };

  const joinRoom = async () => {
    if (!roomId.trim()) {
      alert('Please enter a room ID');
      return;
    }

    try {
      const response = await fetch(`${SERVER_URL}/room/${roomId}`);
      const data = await response.json();
      
      if (data.exists) {
        onJoinRoom(roomId);
      } else {
        alert('Room not found. Please check the room ID or create a new room.');
      }
    } catch (error) {
      console.error('Error joining room:', error);
      alert('Failed to join room. Please check if server is running.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-3xl font-bold text-center mb-2">Video Conference</h1>
        <p className="text-gray-400 text-center mb-8">
          Real-time video conferencing with face detection
        </p>

        <div className="space-y-4">
          <div>
            <label htmlFor="roomId" className="block text-sm font-medium text-gray-300 mb-2">
              Room ID
            </label>
            <input
              type="text"
              id="roomId"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="Enter room ID or leave empty to create new"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex space-x-4">
            <button
              onClick={createRoom}
              disabled={isCreating}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white py-2 px-4 rounded-md transition-colors"
            >
              {isCreating ? 'Creating...' : 'Create New Room'}
            </button>
            
            <button
              onClick={joinRoom}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors"
            >
              Join Room
            </button>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-700">
          <h3 className="text-lg font-semibold mb-2">Features:</h3>
          <ul className="text-gray-400 space-y-1 text-sm">
            <li>✅ Real-time video conferencing</li>
            <li>✅ Face detection with bounding boxes</li>
            <li>✅ Multiple participants support</li>
            <li>✅ Simple room sharing</li>
            <li>✅ Responsive design</li>
          </ul>
        </div>
      </div>
    </div>
  );
};