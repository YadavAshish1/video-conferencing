import { useEffect, useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as blazeface from '@tensorflow-models/blazeface';

export const useFaceDetection = (videoRef, canvasRef, isEnabled = true) => {
  const [model, setModel] = useState(null);
  const [faces, setFaces] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const animationRef = useRef();
  const detectionActive = useRef(false);
 
 
  useEffect(() => {
    const loadModel = async () => {
      try {
        await tf.ready();
        const faceModel = await blazeface.load();
        setModel(faceModel);
        setIsLoading(false);
        console.log('Face detection model loaded');
      } catch (error) {
        console.error('Error loading face detection model:', error);
        setIsLoading(false);
      }
    };

    loadModel();
  }, []);

  const detectFaces = async () => {
    if (!model || !videoRef.current || !canvasRef.current || !isEnabled) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Check if video is ready and playing
    if (video.videoWidth === 0 || video.videoHeight === 0 || video.paused || video.ended) {
      // Try again in the next frame
      if (isEnabled) {
        animationRef.current = requestAnimationFrame(detectFaces);
      }
      return;
    }

    // Set canvas dimensions to match video (only if changed)
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    const ctx = canvas.getContext('2d');

    try {
      const predictions = await model.estimateFaces(video, false);
      
      // Clear previous drawings
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      if (predictions.length > 0) {
        const detectedFaces = predictions.map(prediction => {
          const start = prediction.topLeft;
          const end = prediction.bottomRight;
          const size = [end[0] - start[0], end[1] - start[1]];

          // Draw bounding box
          ctx.strokeStyle = '#00ff00';
          ctx.lineWidth = 2;
          ctx.strokeRect(start[0], start[1], size[0], size[1]);

          // Optional: Add probability text
          ctx.fillStyle = '#00ff00';
          ctx.font = '12px Arial';
          ctx.fillText(
            `Face: ${(prediction.probability[0] * 100).toFixed(1)}%`,
            start[0],
            start[1] - 5
          );

          return {
            topLeft: start,
            bottomRight: end,
            probability: prediction.probability[0]
          };
        });

        setFaces(detectedFaces);
      } else {
        setFaces([]);
      }
    } catch (error) {
      console.error('Error detecting faces:', error);
    }

    // Continue detection loop
    if (isEnabled) {
      animationRef.current = requestAnimationFrame(detectFaces);
    }
  };

  useEffect(() => {
    if (model && videoRef.current && canvasRef.current && isEnabled) {
      // Start detection only if it is not already active
      if (!detectionActive.current) {
        detectionActive.current = true;
        detectFaces();
      }
    } else {
      detectionActive.current = false;
    }

    return () => {
      detectionActive.current = false;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [model, isEnabled]);

  return { faces, isLoading };
};