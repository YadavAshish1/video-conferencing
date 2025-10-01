import React, { useRef, useState, useEffect } from 'react';
import { useSocket } from '../hooks/useSocket';
import { useWebRTC } from '../hooks/useWebRTC';
import { VideoPlayer } from './VideoPlayer';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

export const VideoConference = ({ roomId, userId, onLeaveRoom }) => {
  const localVideoRef = useRef(null);
  const [localStream, setLocalStream] = useState(null);
  const { socket, isConnected } = useSocket(SERVER_URL);
  const { remoteStreams } = useWebRTC(socket, localVideoRef, roomId, userId);

  useEffect(() => {
    const initializeMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
          audio: true
        });
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing media devices:', error);
        alert('Could not access camera and microphone');
      }
    };

    initializeMedia();

    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (socket && isConnected && roomId && userId) {
      socket.emit('join-room', roomId, userId);
    }
  }, [socket, isConnected, roomId, userId]);


  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
      }
    }
  };

 

  const handleLeave = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    onLeaveRoom();
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Video Conference - Room: {roomId}</h1>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded text-sm ${
            isConnected ? 'bg-green-500' : 'bg-red-500'
          }`}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
          <span className="text-sm bg-blue-500 px-2 py-1 rounded">
            Participants: {remoteStreams.size + 1}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        {/* Local Video */}
        <VideoPlayer
          stream={localStream}
          isLocal={true}
          userId="You"
          showFaceDetection={true}
        />

        {/* Remote Videos */}
        {Array.from(remoteStreams.entries()).map(([remoteUserId, stream]) => (
          <VideoPlayer
            key={remoteUserId}
            stream={stream}
            isLocal={false}
            userId={remoteUserId}
            showFaceDetection={false}
          />
        ))}
      </div>

      {/* Controls */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800 rounded-lg p-4 shadow-lg">
        <div className="flex space-x-4">
          <button
            onClick={toggleVideo}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded transition-colors"
          >
            Toggle Video
          </button>
         
          
          <button
            onClick={handleLeave}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded transition-colors"
          >
            Leave Call
          </button>
        </div>
      </div>

      {/* Room Info */}
      <div className="mt-8 p-4 bg-gray-800 rounded">
        <h3 className="text-lg font-semibold mb-2">Room Information</h3>
        <p><strong>Room ID:</strong> {roomId}</p>
        <p><strong>Your User ID:</strong> {userId}</p>
        <p><strong>Share this link:</strong> {window.location.origin}?room={roomId}</p>
      </div>
    </div>
  );
};