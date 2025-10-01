import React, { useRef, useEffect } from 'react';
import { useFaceDetection } from '../hooks/useFaceDetection';

export const VideoPlayer = ({ stream, isLocal, userId, showFaceDetection }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const { faces, isLoading } = useFaceDetection(
    isLocal ? videoRef : null, 
    canvasRef, 
    isLocal && showFaceDetection
  );

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative bg-black rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        muted={isLocal}
        playsInline
        className="w-full h-auto"
      />
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
      />
      
      {/* User info overlay */}
      <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded text-sm">
        {userId} {isLocal && '(You)'}
      </div>

      {/* Face detection status */}
      {isLocal && showFaceDetection && (
        <div className="absolute top-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded text-sm">
          {isLoading ? 'Loading face detection...' : `Faces detected: ${faces.length}`}
        </div>
      )}
    </div>
  );
};