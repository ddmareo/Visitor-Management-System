import React, { useState, useRef, forwardRef, useImperativeHandle, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';

export interface CameraProps {
  onCapture: (imageData: string) => void;
  onStreamReady: (stream: MediaStream) => void;
}

export interface CameraRef {
  captureImage: () => void;
}

const CameraObject = forwardRef<CameraRef, CameraProps>(({ onCapture, onStreamReady }, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    // Set mounted ref to true when component mounts
    mounted.current = true;

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Camera API tidak didukung di browser ini');
      return;
    }

    startCamera();

    // Cleanup function
    return () => {
      mounted.current = false;
      if (streamRef.current) {
        const tracks = streamRef.current.getTracks();
        tracks.forEach(track => {
          track.stop();
        });
        streamRef.current = null;
      }
      
      // Clear video source
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 720 },
          height: { ideal: 960 }
        }
      });

      // Check if component is still mounted before updating state
      if (!mounted.current) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          if (mounted.current && videoRef.current) {
            videoRef.current.play();
            onStreamReady(stream);
          }
        };
      }
    } catch (err) {
      if (!mounted.current) return;

      console.error('Error accessing camera:', err);
      
      try {
        const basicStream = await navigator.mediaDevices.getUserMedia({
          video: true
        });

        if (!mounted.current) {
          basicStream.getTracks().forEach(track => track.stop());
          return;
        }
        
        streamRef.current = basicStream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = basicStream;
          videoRef.current.onloadedmetadata = () => {
            if (mounted.current && videoRef.current) {
              videoRef.current.play();
              onStreamReady(basicStream);
            }
          };
        }
      } catch (fallbackErr) {
        if (!mounted.current) return;

        console.error('Fallback camera access failed:', fallbackErr);
        if (err instanceof Error) {
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            setError('Akses kamera ditolak. Mohon izinkan akses kamera di browser Anda');
          } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
            setError('Kamera tidak ditemukan. Pastikan kamera terhubung dengan benar');
          } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
            setError('Kamera sedang digunakan oleh aplikasi lain');
          } else {
            setError('Terjadi kesalahan saat mengakses kamera. Silakan coba lagi');
          }
        } else {
          setError('Terjadi kesalahan yang tidak diketahui');
        }
      }
    }
  };

  const captureImage = () => {
    if (!mounted.current) return;
    
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        onCapture(imageData);
      }
    }
  };

  useImperativeHandle(ref, () => ({
    captureImage
  }));

  return (
    <div className="relative w-full h-full bg-black">
      {!error ? (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          <canvas ref={canvasRef} className="hidden" />
        </>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 p-4">
          <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
          <p className="text-white text-center">{error}</p>
        </div>
      )}
    </div>
  );
});

CameraObject.displayName = 'CameraObject';

export default CameraObject;