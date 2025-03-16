// cameraverify.tsx
import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, RotateCcw, CheckCircle, XCircle, Loader2, ScanFace } from 'lucide-react';
import CameraObject, { CameraRef } from './camera';
import { loadFaceApiModels, compareFaces } from '@/utils/faceverif';

export interface CameraVerifyProps {
  onClose: () => void;
  onVerificationComplete: (success: boolean, score?: number) => void;
  referenceImage: string | undefined;
}

export default function CameraVerify({ onClose, onVerificationComplete, referenceImage }: CameraVerifyProps) {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    success: boolean;
    score?: number;
    message?: string;
  } | null>(null);
  
  const cameraRef = useRef<CameraRef>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [loadingModels, setLoadingModels] = useState(true);

  // First useEffect - only runs once for face API initialization
  useEffect(() => {
    async function initializeFaceApi() {
      setLoadingModels(true);
      const loaded = await loadFaceApiModels();
      setModelsLoaded(loaded);
      setLoadingModels(false);
    }

    initializeFaceApi();
  }, []); // Empty dependency array - only runs once

  // Second useEffect - specifically for stream cleanup
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]); // Depends on stream

  // Handle image capture from camera
  const handleCapture = (imageData: string) => {
    setCapturedImage(imageData);
  };

  // Allow retaking the photo
  const handleRetake = () => {
    setCapturedImage(null);
    setVerificationResult(null);
  };

  // Trigger image capture
  const handleTakePhoto = () => {
    cameraRef.current?.captureImage();
  };

  // Verify the captured image against the reference image
  const handleVerify = async () => {
    if (!capturedImage || !referenceImage || !modelsLoaded) {
      setVerificationResult({ 
        success: false, 
        message: 'Missing image data or face detection models not loaded.' 
      });
      return;
    }

    setVerifying(true);
    
    try {
      const result = await compareFaces(referenceImage, capturedImage);
      
      if (!result) {
        throw new Error('Face comparison failed');
      }
      
      if (result.noFacesDetected) {
        setVerificationResult({ 
          success: false, 
          message: 'No face detected in one or both images.' 
        });
        onVerificationComplete(false);
      } else if (result.multipleFaces) {
        setVerificationResult({ 
          success: false, 
          message: 'Multiple faces detected. Please ensure only one face is in the frame.' 
        });
        onVerificationComplete(false);
      } else {
        setVerificationResult({ 
          success: result.isMatch, 
          score: result.score 
        });
        onVerificationComplete(result.isMatch, result.score);
        
        // Auto close on successful verification after a delay
        if (result.isMatch) {
          setTimeout(onClose, 1500);
        }
      }
    } catch (error) {
      console.error('Verification error:', error);
      setVerificationResult({ 
        success: false, 
        message: 'An error occurred during verification.' 
      });
      onVerificationComplete(false);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-transparent p-4 w-full max-w-xl mx-4">
        <div className="relative w-full">
          {/* Camera viewport with overlayed controls */}
          <div className="aspect-[3/4] bg-gray-900 rounded-lg overflow-hidden relative">
            {/* Loading states or camera/captured image */}
            {loadingModels ? (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 text-blue-500 mx-auto mb-2 animate-spin" />
                  <p className="text-white">Loading face recognition models...</p>
                </div>
              </div>
            ) : !modelsLoaded ? (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center p-4">
                  <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                  <p className="text-white">Failed to load face recognition models.</p>
                  <p className="text-gray-400 mt-2">Please refresh and try again.</p>
                </div>
              </div>
            ) : capturedImage ? (
              <div className="relative w-full h-full">
                <img 
                  src={capturedImage} 
                  alt="Captured" 
                  className="w-full h-full object-cover"
                />
                {verificationResult && (
                  <div className={`absolute inset-0 flex flex-col items-center justify-center bg-black/50
                    ${verificationResult.success ? 'bg-green-500/50' : 'bg-red-500/50'}`}>
                    {verificationResult.success ? (
                      <CheckCircle className="h-16 w-16 text-white" />
                    ) : (
                      <XCircle className="h-16 w-16 text-white" />
                    )}
                    {verificationResult.message && (
                      <p className="text-white text-center mt-2 px-4">{verificationResult.message}</p>
                    )}
                    {verificationResult.score !== undefined && (
                      <p className="text-white text-center mt-1">
                        Match score: {(verificationResult.score * 100).toFixed(1)}%
                      </p>
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
            
            {/* Close button - always visible at top-right */}
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 bg-black/40 rounded-full p-2 text-white hover:bg-black/60 transition-colors"
              aria-label="Close"
            >
              <X className="h-6 w-6" />
            </button>
            
            {/* Camera controls at the bottom */}
            {(modelsLoaded && !loadingModels) && (
              <div className="absolute bottom-0 left-0 right-0 flex justify-center items-center p-6 bg-gradient-to-t from-black/50 to-transparent">
                {capturedImage ? (
                  verificationResult ? (
                    /* Show retry button after verification */
                    <button
                      type="button"
                      onClick={handleRetake}
                      className="p-3 bg-white/20 text-white rounded-full hover:bg-white/30 transition-colors"
                      aria-label="Retake photo"
                    >
                      <RotateCcw className="h-8 w-8" />
                    </button>
                  ) : (
                    /* Show these controls after capture but before verification */
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
                        onClick={handleVerify}
                        disabled={verifying}
                        className="p-3 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors disabled:opacity-50"
                        aria-label="Verify identity"
                      >
                        {verifying ? (
                          <Loader2 className="h-8 w-8 animate-spin" />
                        ) : (
                          <ScanFace className="h-8 w-8" />
                        )}
                      </button>
                    </div>
                  )
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}