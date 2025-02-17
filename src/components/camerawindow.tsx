// camerawindow.tsx
import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, RotateCcw } from 'lucide-react';
import CameraObject, { CameraRef, CameraMode } from './camera';

export interface CameraWindowProps {
  mode: CameraMode;
  onClose: () => void;
  onCapture: (imageData: string) => void;
  referenceImage?: string; // For verify mode
}

export default function CameraWindow({ mode, onClose, onCapture, referenceImage }: CameraWindowProps) {
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

  const getTitle = () => {
    switch (mode) {
      case 'capture':
        return 'Capture Face';
      case 'verify':
        return 'Verify Face';
      default:
        return 'Scan Face';
    }
  };

  const getConfirmButtonText = () => {
    switch (mode) {
      case 'capture':
        return 'Save Capture';
      case 'verify':
        return 'Verify Identity';
      default:
        return 'Confirm';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 w-full max-w-xl mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg text-gray-900 dark:text-white">{getTitle()}</h2>
          <button 
            onClick={onClose}
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
                  mode={mode}
                  onCapture={handleCapture}
                  onStreamReady={setStream}
                  referenceImage={referenceImage}
                />
              )}
            </div>
          </div>
          
          <div className="flex flex-col gap-4 justify-center items-center">
            <button
              type="button"
              onClick={capturedImage ? handleRetake : handleTakePhoto}
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
                {getConfirmButtonText()}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}