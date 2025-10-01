import { useEffect, useRef, useState } from 'react';

export const useWebRTC = (socket, localVideoRef, roomId, userId) => {
  const [remoteStreams, setRemoteStreams] = useState(new Map());
  const pcRefs = useRef(new Map());

  useEffect(() => {
    if (!socket || !roomId || !userId) return;

    const createPeerConnection = (targetUserId) => {
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });

      // Add local stream to connection
      const localStream = localVideoRef.current?.srcObject;
      if (localStream) {
        localStream.getTracks().forEach(track => {
          pc.addTrack(track, localStream);
        });
      }

      // Handle incoming remote stream
      pc.ontrack = (event) => {
        const [remoteStream] = event.streams;
        setRemoteStreams(prev => new Map(prev).set(targetUserId, remoteStream));
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('webrtc-ice-candidate', {
            target: targetUserId,
            candidate: event.candidate,
            sender: userId
          });
        }
      };

      return pc;
    };

    // Socket event handlers
    const handleUserConnected = async (targetUserId) => {
      const pc = createPeerConnection(targetUserId);
      pcRefs.current.set(targetUserId, pc);

      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket.emit('webrtc-offer', {
          target: targetUserId,
          offer: offer,
          sender: userId
        });
      } catch (error) {
        console.error('Error creating offer:', error);
      }
    };

    const handleWebRTCOffer = async (data) => {
      const pc = createPeerConnection(data.sender);
      pcRefs.current.set(data.sender, pc);

      try {
        await pc.setRemoteDescription(data.offer);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit('webrtc-answer', {
          target: data.sender,
          answer: answer,
          sender: userId
        });
      } catch (error) {
        console.error('Error handling offer:', error);
      }
    };

    const handleWebRTCAnswer = async (data) => {
      const pc = pcRefs.current.get(data.sender);
      if (pc) {
        await pc.setRemoteDescription(data.answer);
      }
    };

    const handleWebRTCIceCandidate = async (data) => {
      const pc = pcRefs.current.get(data.sender);
      if (pc) {
        await pc.addIceCandidate(data.candidate);
      }
    };

    const handleUserDisconnected = (disconnectedUserId) => {
      const pc = pcRefs.current.get(disconnectedUserId);
      if (pc) {
        pc.close();
        pcRefs.current.delete(disconnectedUserId);
      }
      setRemoteStreams(prev => {
        const newStreams = new Map(prev);
        newStreams.delete(disconnectedUserId);
        return newStreams;
      });
    };

    const handleCurrentParticipants = (participants) => {
      participants.forEach(participantId => {
        handleUserConnected(participantId);
      });
    };

    // event listeners
    socket.on('user-connected', handleUserConnected);
    socket.on('webrtc-offer', handleWebRTCOffer);
    socket.on('webrtc-answer', handleWebRTCAnswer);
    socket.on('webrtc-ice-candidate', handleWebRTCIceCandidate);
    socket.on('user-disconnected', handleUserDisconnected);
    socket.on('current-participants', handleCurrentParticipants);

    return () => {
      // Cleanup
      socket.off('user-connected', handleUserConnected);
      socket.off('webrtc-offer', handleWebRTCOffer);
      socket.off('webrtc-answer', handleWebRTCAnswer);
      socket.off('webrtc-ice-candidate', handleWebRTCIceCandidate);
      socket.off('user-disconnected', handleUserDisconnected);
      socket.off('current-participants', handleCurrentParticipants);

      // Close all peer connections
      pcRefs.current.forEach(pc => pc.close());
      pcRefs.current.clear();
    };
  }, [socket, roomId, userId, localVideoRef]);

  return { remoteStreams };
};