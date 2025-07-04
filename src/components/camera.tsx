// camera.tsx
import React, { useRef, forwardRef, useImperativeHandle, useEffect, useState, useCallback } from 'react';
import { AlertCircle } from 'lucide-react';

export interface CameraProps {
  onCapture: (imageData: string) => void;
  onStreamReady: (stream: MediaStream) => void;
}

export interface CameraRef {
  captureImage: () => void;
  videoElement: HTMLVideoElement | null; // <-- Add this
}

const CameraObject = forwardRef<CameraRef, CameraProps>(({ onCapture, onStreamReady }, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  const setupCamera = useCallback(async () => {
    let stream: MediaStream | null = null;

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Camera API is not supported in this browser');
      return;
    }

    const hdConstraints = {
      video: {
        facingMode: "user",
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    };

    const basicConstraints = {
      video: true
    };

    try {
      // Try HD constraints first, fall back to basic
      try {
        stream = await navigator.mediaDevices.getUserMedia(hdConstraints);
      } catch {
        stream = await navigator.mediaDevices.getUserMedia(basicConstraints);
      }

      if (!videoRef.current) return;
      
      videoRef.current.srcObject = stream;
      
      videoRef.current.onerror = () => {
        setError('Video playback error occurred');
      };

      onStreamReady(stream);
    } catch (err: any) {
      console.error('Camera error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Camera access denied. Please allow camera access and refresh.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('No camera found. Please connect a camera and refresh.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setError('Camera is in use by another application.');
      } else {
        setError('Could not start camera.');
      }
    }
  }, [onStreamReady]); // Include onStreamReady in dependencies

  useEffect(() => {
    let mediaStream: MediaStream | null = null;
    
    setupCamera().then(() => {
      if (videoRef.current) {
        mediaStream = videoRef.current.srcObject as MediaStream;
      }
    });

    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [setupCamera]); // Now only depends on setupCamera which memoizes onStreamReady

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video.readyState !== video.HAVE_ENOUGH_DATA) {
        console.warn('Video not ready for capture');
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (!context) {
        console.error('Could not get canvas context');
        return;
      }

      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      onCapture(imageData);
    } catch (err) {
      console.error('Error capturing image:', err);
    }
  };

  useImperativeHandle(ref, () => ({
    captureImage,
    videoElement: videoRef.current 
  }));

  if (error) {
    return (
      <div className="relative w-full h-full bg-gray-900 flex items-center justify-center">
        <div className="text-center p-4">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-white">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
});

CameraObject.displayName = 'CameraObject';

export default CameraObject;