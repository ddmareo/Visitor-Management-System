import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, RotateCcw } from 'lucide-react';
import CameraObject, { CameraRef } from './camera';

export interface CameraWindowProps {
  onClose: () => void;
  onCapture: (imageData: string) => void;
}

export default function CameraWindow({ onClose, onCapture }: CameraWindowProps) {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const cameraRef = useRef<CameraRef>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mounted = useRef(true);

  // Improved stop camera function that returns a promise
  const stopCamera = async () => {
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();
      
      // Stop all tracks synchronously
      tracks.forEach(track => {
        try {
          track.stop();
        } catch (error) {
          console.error('Error stopping track:', error);
        }
      });

      // Clear references
      streamRef.current = null;
    }
  };

  useEffect(() => {
    mounted.current = true;

    // Cleanup function
    return () => {
      mounted.current = false;
      stopCamera();
    };
  }, []);

  const handleCapture = (imageData: string) => {
    if (!mounted.current) return;
    setCapturedImage(imageData);
  };

  const handleStreamReady = (stream: MediaStream) => {
    if (!mounted.current) {
      // If component is unmounted when stream becomes ready,
      // stop it immediately
      stream.getTracks().forEach(track => track.stop());
      return;
    }
    streamRef.current = stream;
  };

  const handleToggle = async () => {
    if (!mounted.current) return;

    if (capturedImage) {
      setCapturedImage(null);
    } else {
      cameraRef.current?.captureImage();
    }
  };

  const handleConfirm = async () => {
    if (!mounted.current || !capturedImage) return;

    try {
      // Stop camera before doing anything else
      await stopCamera();
      
      if (mounted.current) {
        onCapture(capturedImage);
        onClose();
      }
    } catch (error) {
      console.error('Error during confirmation:', error);
    }
  };

  const handleClose = async () => {
    if (!mounted.current) return;

    try {
      // Stop camera before closing
      await stopCamera();
      
      if (mounted.current) {
        onClose();
      }
    } catch (error) {
      console.error('Error during close:', error);
      // Still try to close even if there's an error
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 w-full max-w-xl mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg text-gray-900 dark:text-white">Scan Wajah</h2>
          <button 
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="flex gap-4">
          <div className="relative w-full">
            <div className="aspect-[3/4] bg-gray-900 rounded-lg overflow-hidden">
              {capturedImage ? (
                <img 
                  src={capturedImage} 
                  alt="Captured" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <CameraObject 
                  ref={cameraRef}
                  onCapture={handleCapture}
                  onStreamReady={handleStreamReady}
                />
              )}
            </div>
          </div>
          
          <div className="flex flex-col gap-4 justify-center items-center">
            <button
              type="button"
              onClick={handleToggle}
              className="p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 focus:ring-2 focus:ring-blue-300"
              title={capturedImage ? "Retake photo" : "Take photo"}
            >
              {capturedImage ? (
                <RotateCcw className="h-6 w-6" />
              ) : (
                <Camera className="h-6 w-6" />
              )}
            </button>
            
            {capturedImage && (
              <button
                type="button"
                onClick={handleConfirm}
                className="p-3 bg-green-500 text-white rounded-lg hover:bg-green-600 focus:ring-2 focus:ring-green-300 w-full"
              >
                Konfirmasi
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}