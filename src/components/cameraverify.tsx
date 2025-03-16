// cameraverify.tsx
import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, RotateCcw, Check, XCircle, Loader2 } from 'lucide-react';
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

  // Load face-api models on component mount
  useEffect(() => {
    async function initializeFaceApi() {
      setLoadingModels(true);
      const loaded = await loadFaceApiModels();
      setModelsLoaded(loaded);
      setLoadingModels(false);
    }

    initializeFaceApi();

    // Cleanup function to stop the camera stream
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

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
        
        {loadingModels ? (
          <div className="aspect-[3/4] bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="h-8 w-8 text-blue-500 mx-auto mb-2 animate-spin" />
              <p className="text-white">Loading face recognition models...</p>
            </div>
          </div>
        ) : !modelsLoaded ? (
          <div className="aspect-[3/4] bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center">
            <div className="text-center p-4">
              <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="text-white">Failed to load face recognition models.</p>
              <p className="text-gray-400 mt-2">Please refresh and try again.</p>
            </div>
          </div>
        ) : (
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
                      <div className={`absolute inset-0 flex flex-col items-center justify-center bg-black/50
                        ${verificationResult.success ? 'bg-green-500/50' : 'bg-red-500/50'}`}>
                        {verificationResult.success ? (
                          <Check className="h-16 w-16 text-white" />
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
                  {verifying ? (
                    <div className="flex items-center justify-center">
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Verifying...
                    </div>
                  ) : 'Verify Identity'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}