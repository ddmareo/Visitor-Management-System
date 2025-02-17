// camera.tsx
import React, { useRef, forwardRef, useImperativeHandle, useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';

export type CameraMode = 'capture' | 'verify';

export interface CameraProps {
  mode: CameraMode;
  onCapture: (imageData: string) => void;
  onStreamReady: (stream: MediaStream) => void;
  referenceImage?: string; // Used in verify mode for visual reference
}

export interface CameraRef {
  captureImage: () => void;
}

const CameraObject = forwardRef<CameraRef, CameraProps>(({ mode, onCapture, onStreamReady, referenceImage }, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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

    navigator.mediaDevices.getUserMedia(hdConstraints)
      .catch(() => navigator.mediaDevices.getUserMedia(basicConstraints))
      .then(videoStream => {
        if (!videoRef.current) return;
        
        stream = videoStream;
        videoRef.current.srcObject = stream;
        
        videoRef.current.onerror = () => {
          setError('Video playback error occurred');
        };

        onStreamReady(stream);
      })
      .catch(err => {
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
      });

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

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
    captureImage
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
      {mode === 'verify' && referenceImage && (
        <div className="absolute top-0 right-0 z-10 p-2">
          <img 
            src={referenceImage} 
            alt="Reference" 
            className="w-24 h-32 object-cover rounded-lg border-2 border-white"
          />
        </div>
      )}
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