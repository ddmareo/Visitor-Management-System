// cameraregister.tsx
import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, RotateCcw, CheckCircle } from 'lucide-react';
import CameraObject, { CameraRef } from './camera';

export interface CameraRegisterProps {
  onClose: () => void;
  onCapture: (imageData: string) => void;
}

export default function CameraRegister({ onClose, onCapture }: CameraRegisterProps) {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const cameraRef = useRef<CameraRef>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const handleCapture = (imageData: string) => {
    setCapturedImage(imageData);
  };

  const handleRetake = () => {
    setCapturedImage(null);
  };

  const handleTakePhoto = () => {
    cameraRef.current?.captureImage();
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-transparent p-4 w-full max-w-xl mx-4">        
        <div className="relative w-full">
          {/* Camera viewport with overlayed controls */}
          <div className="aspect-[3/4] bg-gray-900 rounded-lg overflow-hidden relative">
            {/* Camera or captured image */}
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
                onStreamReady={setStream}
              />
            )}
            
            {/* Close button - always visible at top-right */}
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 bg-black/40 rounded-full p-2 text-white hover:bg-black/60 transition-colors"
              aria-label="Close"
            >
              <X className="h-6 w-6" />
            </button>
            
            {/* Camera controls at the bottom */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-center items-center p-6 bg-gradient-to-t from-black/50 to-transparent">
              {capturedImage ? (
                /* Show these controls after capture */
                <div className="flex justify-center items-center space-x-12 w-full">
                  <button
                    type="button"
                    onClick={handleRetake}
                    className="p-3 bg-white/20 text-white rounded-full hover:bg-white/30 transition-colors"
                    aria-label="Retake photo"
                  >
                    <RotateCcw className="h-8 w-8" />
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleConfirm}
                    className="p-3 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
                    aria-label="Save photo"
                  >
                    <CheckCircle className="h-8 w-8" />
                  </button>
                </div>
              ) : (
                /* Show capture button when camera is active */
                <button
                  type="button"
                  onClick={handleTakePhoto}
                  className="p-4 bg-white rounded-full hover:bg-gray-200 border-4 border-gray-300 transition-colors"
                  aria-label="Take photo"
                >
                  <Camera className="h-8 w-8 text-gray-800" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}