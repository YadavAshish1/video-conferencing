import { useState, useRef, useCallback, useEffect } from 'react';
import { useSocket } from './useSocket';

export const useVideoConference = (serverUrl) => {
  const [localStream, setLocalStream] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);

  const localVideoRef = useRef(null);
  const remoteVideoRefs = useRef({});
  const peerConnections = useRef({});

  // Use our single socket hook
  const socket = useSocket(serverUrl, {
    autoConnect: false,
    onConnect: () => {
      console.log('Connected to video conference server');
    },
    onDisconnect: (reason) => {
      console.log('Disconnected from video conference:', reason);
      // Clean up peer connections
      Object.values(peerConnections.current).forEach(pc => pc.close());
      peerConnections.current = {};
      setParticipants([]);
    },
  });

  // Socket event listeners for video conference
  useEffect(() => {
    const { on, off } = socket;

    // Room events
    on('user-connected', handleUserConnected);
    on('user-disconnected', handleUserDisconnected);
    on('current-participants', handleCurrentParticipants);

    // WebRTC events
    on('webrtc-offer', handleWebRTCOffer);
    on('webrtc-answer', handleWebRTCAnswer);
    on('webrtc-ice-candidate', handleICECandidate);

    return () => {
      off('user-connected', handleUserConnected);
      off('user-disconnected', handleUserDisconnected);
      off('current-participants', handleCurrentParticipants);
      off('webrtc-offer', handleWebRTCOffer);
      off('webrtc-answer', handleWebRTCAnswer);
      off('webrtc-ice-candidate', handleICECandidate);
    };
  }, [socket.on, socket.off]);

  const joinRoom = useCallback(async (roomId) => {
    try {
      // Connect to socket if not already connected
      if (!socket.isConnected) {
        socket.connect();
        
        // Wait for connection
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Connection timeout')), 5000);
          const checkInterval = setInterval(() => {
            if (socket.isConnected) {
              clearInterval(checkInterval);
              clearTimeout(timeout);
              resolve();
            }
          }, 100);
        });
      }

      // Get local media stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Join room
      const success = socket.joinRoom(roomId, {
        userId: `user-${Date.now()}`,
      });

      if (success) {
        setCurrentRoom(roomId);
      }

      return success;
    } catch (error) {
      console.error('Error joining room:', error);
      throw error;
    }
  }, [socket]);

  const leaveRoom = useCallback(() => {
    if (currentRoom) {
      socket.leaveRoom(currentRoom);
    }
    socket.disconnect();
    setCurrentRoom(null);
    
    // Clean up local stream
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
  }, [socket, currentRoom, localStream]);

  // WebRTC handlers
  const handleUserConnected = useCallback((data) => {
    console.log('User connected, creating peer connection:', data.userId);
    createPeerConnection(data.userId);
  }, []);

  const handleUserDisconnected = useCallback((data) => {
    console.log('User disconnected, closing peer connection:', data.userId);
    if (peerConnections.current[data.userId]) {
      peerConnections.current[data.userId].close();
      delete peerConnections.current[data.userId];
    }
    setParticipants(prev => prev.filter(p => p.userId !== data.userId));
  }, []);

  const handleCurrentParticipants = useCallback((participantsList) => {
    setParticipants(participantsList);
    // Create peer connections for existing participants
    participantsList.forEach(participant => {
      if (participant.userId !== socket.getSocketId()) {
        createPeerConnection(participant.userId);
      }
    });
  }, [socket.getSocketId]);

  const createPeerConnection = useCallback((userId) => {
    const peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    // Add local stream
    if (localStream) {
      localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
      });
    }

    // Handle incoming stream
    peerConnection.ontrack = (event) => {
      const remoteStream = event.streams[0];
      if (remoteVideoRefs.current[userId]) {
        remoteVideoRefs.current[userId].srcObject = remoteStream;
      }
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.sendIceCandidate(userId, event.candidate, currentRoom);
      }
    };

    peerConnections.current[userId] = peerConnection;

    // Create and send offer
    peerConnection.createOffer()
      .then(offer => peerConnection.setLocalDescription(offer))
      .then(() => {
        socket.sendOffer(userId, peerConnection.localDescription, currentRoom);
      });

    setParticipants(prev => [...prev, { userId, stream: null }]);
  }, [localStream, socket, currentRoom]);

  const handleWebRTCOffer = useCallback(async (data) => {
    const { sender, offer, roomId } = data;
    
    const peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    // Add local stream
    if (localStream) {
      localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
      });
    }

    // Handle incoming stream
    peerConnection.ontrack = (event) => {
      const remoteStream = event.streams[0];
      if (remoteVideoRefs.current[sender]) {
        remoteVideoRefs.current[sender].srcObject = remoteStream;
      }
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.sendIceCandidate(sender, event.candidate, roomId);
      }
    };

    await peerConnection.setRemoteDescription(offer);
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    socket.sendAnswer(sender, peerConnection.localDescription, roomId);
    peerConnections.current[sender] = peerConnection;
  }, [localStream, socket]);

  const handleWebRTCAnswer = useCallback(async (data) => {
    const { sender, answer } = data;
    const peerConnection = peerConnections.current[sender];
    
    if (peerConnection) {
      await peerConnection.setRemoteDescription(answer);
    }
  }, []);

  const handleICECandidate = useCallback(async (data) => {
    const { sender, candidate } = data;
    const peerConnection = peerConnections.current[sender];
    
    if (peerConnection && candidate) {
      await peerConnection.addIceCandidate(candidate);
    }
  }, []);

  return {
    // States
    localStream,
    participants,
    currentRoom,
    isConnected: socket.isConnected,
    connectionError: socket.connectionError,

    // Refs
    localVideoRef,
    remoteVideoRefs,

    // Methods
    joinRoom,
    leaveRoom,

    // Socket methods
    socket,
  };
};