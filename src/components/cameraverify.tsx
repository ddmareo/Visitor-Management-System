// cameraverify.tsx
import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, RotateCcw, Check, XCircle } from 'lucide-react';
import CameraObject, { CameraRef } from './camera';
import { 
  FaceMetrics, 
  initializeFaceLandmarker, 
  compareFaces, 
  isGoodMatch, 
  SerializedBuffer 
} from '@/utils/faceverif';

export interface CameraVerifyProps {
  onClose: () => void;
  onVerificationComplete: (success: boolean, metrics?: FaceMetrics) => void;
  referenceImage: string | SerializedBuffer | undefined;
}

export default function CameraVerify({ onClose, onVerificationComplete, referenceImage }: CameraVerifyProps) {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    success: boolean;
    metrics?: FaceMetrics;
  } | null>(null);
  
  const cameraRef = useRef<CameraRef>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [faceLandmarker, setFaceLandmarker] = useState<any | null>(null);

  useEffect(() => {
    initializeFaceLandmarker().then(setFaceLandmarker).catch(console.error);

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const dataURItoBuffer = (dataURI: string): SerializedBuffer => {
    // Remove the data URI prefix to get just the base64 data
    const base64 = dataURI.split(',')[1] || dataURI;
    // Convert base64 to binary string
    const binary = atob(base64);
    // Create array buffer from binary string
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return {
      data: Array.from(bytes),
      type: "Buffer"
    };
  };

  const getSerializedBuffer = (image: string | SerializedBuffer | undefined): SerializedBuffer | null => {
    if (!image) return null;
    
    if (typeof image === 'string') {
      return dataURItoBuffer(image);
    }
    
    return image;
  };

  const handleCapture = (imageData: string) => {
    setCapturedImage(imageData);
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setVerificationResult(null);
  };

  const handleTakePhoto = () => {
    cameraRef.current?.captureImage();
  };

  const handleVerify = async () => {
    if (!capturedImage || !faceLandmarker || !referenceImage) return;

    setVerifying(true);
    try {
      const liveImageBuffer = dataURItoBuffer(capturedImage);
      const referenceBuffer = getSerializedBuffer(referenceImage);
      
      if (!referenceBuffer) {
        throw new Error('Invalid reference image');
      }

      const metrics = await compareFaces(faceLandmarker, liveImageBuffer, referenceBuffer);
      
      if (metrics) {
        const success = isGoodMatch(metrics);
        setVerificationResult({ success, metrics });
        onVerificationComplete(success, metrics);
        if (success) {
          setTimeout(onClose, 1500);
        }
      } else {
        setVerificationResult({ success: false });
        onVerificationComplete(false);
      }
    } catch (error) {
      console.error('Verification error:', error);
      setVerificationResult({ success: false });
      onVerificationComplete(false);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 w-full max-w-xl mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg text-gray-900 dark:text-white">Verify Identity</h2>
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
                <div className="relative w-full h-full">
                  <img 
                    src={capturedImage} 
                    alt="Captured" 
                    className="w-full h-full object-cover"
                  />
                  {verificationResult && (
                    <div className={`absolute inset-0 flex items-center justify-center bg-black/50
                      ${verificationResult.success ? 'bg-green-500/50' : 'bg-red-500/50'}`}>
                      {verificationResult.success ? (
                        <Check className="h-16 w-16 text-white" />
                      ) : (
                        <XCircle className="h-16 w-16 text-white" />
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <CameraObject 
                  ref={cameraRef}
                  onCapture={handleCapture}
                  onStreamReady={setStream}
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
              disabled={verifying}
            >
              {capturedImage ? (
                <RotateCcw className="h-6 w-6" />
              ) : (
                <Camera className="h-6 w-6" />
              )}
            </button>
            
            {capturedImage && !verificationResult && (
              <button
                type="button"
                onClick={handleVerify}
                disabled={verifying}
                className="p-3 bg-green-500 text-white rounded-lg hover:bg-green-600 focus:ring-2 focus:ring-green-300 w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {verifying ? 'Verifying...' : 'Verify Identity'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}