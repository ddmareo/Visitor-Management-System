// FaceScanModal.tsx
import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, RotateCcw, CheckCircle, XCircle, Loader2, ScanFace } from 'lucide-react';
import CameraObject, { CameraRef } from './camera'; // Assuming camera.tsx is in the same folder or adjust path
import { loadFaceApiModels, compareFaces, detectFaces } from '@/utils/faceverif'; // Assuming path
import { cropImageToAspectRatio } from '@/utils/cropfacescan';
import * as faceapi from 'face-api.js'; // Import face-api.js for face detection

// Define the possible modes
type ScanMode = 'register' | 'verify';

type ValidationStatus = 'idle' | 'detecting' | 'no_face' | 'multiple_faces' | 'off_center' | 'valid' | 'error';

// Define props based on the mode
interface BaseProps {
  onClose: () => void;
  mode: ScanMode;
}

interface RegisterProps extends BaseProps {
  mode: 'register';
  onRegisterConfirm: (imageData: string) => void;
  // Exclude verify-specific props if needed, or make them optional
  referenceImage?: never;
  onVerificationComplete?: never;
}

interface VerifyProps extends BaseProps {
  mode: 'verify';
  referenceImage: string | undefined; // Required for verify mode
  onVerificationComplete: (success: boolean, score?: number) => void;
  // Exclude register-specific props if needed, or make them optional
  onRegisterConfirm?: never;
}

// Combine props using a discriminated union
export type FaceScanModalProps = RegisterProps | VerifyProps;

// Define acceptable center region (percentages of video width/height)
const TARGET_ASPECT_RATIO = 3 / 4; // Define target ratio
const FACE_CENTER_THRESHOLD_X = 0.3; // Allows center point within central 40% (1 - 2*0.3)
const FACE_CENTER_THRESHOLD_Y = 0.4; // Allows center point within central 50% (1 - 2*0.25)
const DETECTION_INTERVAL = 150; // ms between detections (adjust for performance)
const AUTO_CAPTURE_DELAY = 1500; // ms - How long face must be valid before auto-capture

export default function FaceScanModal(props: FaceScanModalProps) {
  const { onClose, mode } = props; // Common props

  // State common to both modes
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const cameraRef = useRef<CameraRef>(null);
  const [cameraError, setCameraError] = useState<string | null>(null); // Handle camera errors here

  // State specific to 'verify' mode
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    success: boolean;
    score?: number;
    message?: string;
  } | null>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [loadingModels, setLoadingModels] = useState(true); // Only load if in verify mode initially

  // Live Validation State (primarily for 'register' mode pre-capture, but useful for 'verify' too)
  const [validationStatus, setValidationStatus] = useState<ValidationStatus>('idle');
  const [validationMessage, setValidationMessage] = useState<string | null>('Initializing...');
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isDetectingRef = useRef(false); // Prevent overlapping detections

  // --- Effects ---

  // Effect 1: Load Models (Runs once or if mode changes)
  useEffect(() => {
    async function initializeFaceApi() {
      setLoadingModels(true);
      setValidationStatus("idle");
      setValidationMessage("Loading models...");
      try {
        const loaded = await loadFaceApiModels();
        setModelsLoaded(loaded);
        if (!loaded) {
          setValidationStatus("error");
          setValidationMessage('Failed to load face models.');
        } else {
          // Models loaded, ready for detection IF stream is also ready
           setValidationMessage("Initializing camera..."); // Next step message
        }
      } catch (error) {
        console.error("Error loading FaceAPI models:", error);
        setModelsLoaded(false);
        setValidationStatus("error");
        setValidationMessage('Error loading face models.');
      } finally {
        setLoadingModels(false);
      }
    }
    initializeFaceApi();
  }, [mode]); // Depend only on mode for model loading trigger

    // Effect 2: Stream Cleanup
    useEffect(() => {
        return () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            console.log("Stream stopped on cleanup");
        }
        // Clear detection interval on unmount/stream change
        if (detectionIntervalRef.current) {
            clearInterval(detectionIntervalRef.current);
            detectionIntervalRef.current = null;
        }
        isDetectingRef.current = false;
        };
    }, [stream]); // Depend only on stream

    // Effect 3: Live Face Detection Loop
  useEffect(() => {
    // Ensure cleanup occurs if dependencies change
    const cleanupDetection = () => {
         if (detectionIntervalRef.current) {
            clearInterval(detectionIntervalRef.current);
            detectionIntervalRef.current = null;
        }
        isDetectingRef.current = false;
        // Reset status when loop stops? Maybe not, keep last known status until capture/retake
        // setValidationStatus('idle');
        // setValidationMessage('Camera inactive or models not loaded.');
    };

    if (mode === 'register' && modelsLoaded && stream && cameraRef.current?.videoElement) {
      const videoElement = cameraRef.current.videoElement;

       if (videoElement.readyState < videoElement.HAVE_METADATA) {
           // Wait for video metadata to be loaded
           const handleMetadataLoaded = () => {
               startDetectionLoop(videoElement);
               videoElement.removeEventListener('loadedmetadata', handleMetadataLoaded);
           };
           videoElement.addEventListener('loadedmetadata', handleMetadataLoaded);
           setValidationMessage("Waiting for video...");
           return cleanupDetection; // Cleanup if effect re-runs before metadata loads
       } else {
           // Metadata already loaded, start immediately
           startDetectionLoop(videoElement);
       }
    } else if (mode === 'verify' /* && potentially add conditions for live verify later */) {
        // Placeholder: Live detection logic for verify mode could go here
        // For now, verify mode doesn't use live pre-capture validation in this example
        cleanupDetection(); // Ensure no loop runs in verify mode for now
        setValidationStatus('idle'); // Reset for verify mode
        setValidationMessage('');
    } else {
       // Conditions not met (no stream, models not loaded, etc.)
       cleanupDetection();
       // Update status if needed based on why loop isn't running
       if (!modelsLoaded && !loadingModels) {
           setValidationMessage("Models failed to load.");
           setValidationStatus('error');
       } else if (!stream) {
            setValidationMessage("Initializing camera...");
            setValidationStatus('idle');
       }
    }

    // Cleanup function for the effect
    return cleanupDetection;

  }, [mode, modelsLoaded, loadingModels, stream, cameraRef.current?.videoElement]); // Dependencies

    // --- Detection Loop Function ---
    const startDetectionLoop = (videoElement: HTMLVideoElement) => {
        if (detectionIntervalRef.current) { // Clear any existing interval
            clearInterval(detectionIntervalRef.current);
        }
        isDetectingRef.current = false; // Reset detection flag

        detectionIntervalRef.current = setInterval(async () => {
            if (!cameraRef.current?.videoElement || videoElement.paused || videoElement.ended || !modelsLoaded || isDetectingRef.current) {
            return; // Skip if video not ready, paused, ended, models unloaded, or already detecting
            }

            if (videoElement.readyState < videoElement.HAVE_CURRENT_DATA) {
                // Not enough data yet
                setValidationStatus('detecting');
                setValidationMessage("Waiting for video data...");
                return;
            }

            isDetectingRef.current = true; // Set detection flag

            try {
            // Use lower resolution input for faster detection if needed
            const detectionOptions = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 });
            // console.time("detection"); // Optional: time detection
            const detections = await detectFaces(videoElement, detectionOptions);
            // console.timeEnd("detection");

            const videoWidth = videoElement.videoWidth;
            const videoHeight = videoElement.videoHeight;

            if (detections.length === 0) {
                setValidationStatus('no_face');
                setValidationMessage('No face detected.');
            } else if (detections.length > 1) {
                setValidationStatus('multiple_faces');
                setValidationMessage('Multiple faces detected.');
            } else {
                // Exactly one face detected, check position
                const box = detections[0].detection.box;
                const faceCenterX = box.x + box.width / 2;
                const faceCenterY = box.y + box.height / 2;

                const isCenteredX =
                faceCenterX > videoWidth * FACE_CENTER_THRESHOLD_X &&
                faceCenterX < videoWidth * (1 - FACE_CENTER_THRESHOLD_X);
                const isCenteredY =
                faceCenterY > videoHeight * FACE_CENTER_THRESHOLD_Y &&
                faceCenterY < videoHeight * (1 - FACE_CENTER_THRESHOLD_Y);

                if (isCenteredX && isCenteredY) {
                setValidationStatus('valid');
                setValidationMessage('Ready to capture!');
                } else {
                setValidationStatus('off_center');
                setValidationMessage('Please center your face.');
                }
            }
            } catch (error) {
            console.error('Error during face detection loop:', error);
            setValidationStatus('error');
            setValidationMessage('Detection error occurred.');
            // Consider stopping the loop on error?
            // if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
            } finally {
                isDetectingRef.current = false; // Reset detection flag
            }
        }, DETECTION_INTERVAL); // Run detection periodically
    };

  // --- Handlers ---

  const handleStreamReady = (mediaStream: MediaStream) => {
    setStream(mediaStream);
    setCameraError(null); // Clear previous errors on stream ready
  };
  
    const handleCapture = async (rawImageData: string) => {
        // Stop detection loop on capture
        if (detectionIntervalRef.current) {
            clearInterval(detectionIntervalRef.current);
            detectionIntervalRef.current = null;
        }
        isDetectingRef.current = false;

    setCapturedImage(null); // Clear previous while processing
    // ... (cropping logic using cropImageToAspectRatio remains the same)
        try {
        const croppedImageData = await cropImageToAspectRatio(rawImageData, TARGET_ASPECT_RATIO);
        setCapturedImage(croppedImageData);
        setVerificationResult(null);
        // Keep validation status to indicate why capture was allowed, or clear it
        // setValidationStatus('idle');
        // setValidationMessage('');
        } catch (error) {
            console.error("Failed to crop captured image:", error);
            setVerificationResult({ success: false, message: 'Failed to process image. Please retake.' });
            setValidationStatus('error'); // Reflect crop error
            setValidationMessage('Image processing failed.');
        }
    };

    const handleRetake = () => {
        setCapturedImage(null);
        setVerificationResult(null);
        // Restart detection loop only if conditions are still met
        if (mode === 'register' && modelsLoaded && stream && cameraRef.current?.videoElement) {
            startDetectionLoop(cameraRef.current.videoElement);
            setValidationStatus('detecting'); // Initial state after retake
            setValidationMessage('Detecting face...');
        } else {
            setValidationStatus('idle');
            setValidationMessage(''); // Or appropriate message
        }
    };
    

    const handleTakePhoto = () => {
        // Capture should only be possible if validationStatus is 'valid'
        if (validationStatus === 'valid') {
            cameraRef.current?.captureImage();
        } else {
            console.warn("Attempted to capture photo when validation status was not 'valid'. Status:", validationStatus);
            // Optionally provide feedback why capture isn't allowed yet
            // e.g., shake the button, show a temporary message
        }
    };

  // Combined handler for the final action button
  const handleConfirmOrVerify = async () => {
    if (!capturedImage) return;

    if (mode === 'register' && props.mode === 'register' && capturedImage) { // Type guard
      props.onRegisterConfirm(capturedImage);
      onClose(); // Typically close after registration confirmation
    } else if (mode === 'verify' && props.mode === 'verify' && capturedImage) { // Type guard
        if (!props.referenceImage || !modelsLoaded || verificationResult?.message?.includes('load')) { // Prevent verification if models failed to load
            setVerificationResult({
                success: false,
                message: !props.referenceImage ? 'Missing reference image.' : 'Face models not ready.',
            });
            return;
        }
      setVerifying(true);
      setVerificationResult(null); // Clear previous result before new attempt

      try {
        const result = await compareFaces(props.referenceImage, capturedImage);

        if (!result) {
          throw new Error('Face comparison failed or returned null');
        }

        let message: string | undefined = undefined;
        if (result.noFacesDetected) message = 'No face detected in one or both images.';
        else if (result.multipleFaces) message = 'Multiple faces detected. Please ensure only one face is in the frame.';
        else if (!result.isMatch) message = 'Verification Failed.';
        else message = 'Verification Successful!'; // Or keep it undefined for success

        const finalResult = {
            success: result.isMatch,
            score: result.score,
            message: message,
        };

        setVerificationResult(finalResult);
        props.onVerificationComplete(finalResult.success, finalResult.score);

        if (finalResult.success) {
          setTimeout(onClose, 1500); // Auto close on success
        }
      } catch (error) {
        console.error('Verification error:', error);
        const errorResult = {
          success: false,
          message: 'An error occurred during verification.',
        };
        setVerificationResult(errorResult);
        props.onVerificationComplete(errorResult.success);
      } finally {
        setVerifying(false);
      }
    }
  };

  // --- Render Logic ---

  const showLoadingOverlay = mode === 'verify' && loadingModels;
  const showModelLoadErrorOverlay = mode === 'verify' && !loadingModels && !modelsLoaded;
  const isCaptureDisabled = mode === 'register' && validationStatus !== 'valid'; // Disable capture if not valid
  const showCamera = !capturedImage && !showLoadingOverlay && !showModelLoadErrorOverlay;
  const showPreview = !!capturedImage && !showLoadingOverlay && !showModelLoadErrorOverlay;

  const isActionDisabled = (mode === 'verify' && (!modelsLoaded || verifying || loadingModels));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-transparent p-4 w-full max-w-xl mx-4">
        <div className="relative w-full">
          {/* Aspect Ratio Container */}
          <div className="aspect-[3/4] bg-gray-900 rounded-lg overflow-hidden relative shadow-lg">

            {/* 1. Loading/Error Overlays (Highest Priority) */}
            {loadingModels && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900/90 z-40">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 text-blue-500 mx-auto mb-2 animate-spin" />
                  <p className="text-white">{validationMessage || 'Loading models...'}</p>
                </div>
              </div>
            )}
            {!loadingModels && !modelsLoaded && ( // Model Load Error
                <div className="absolute inset-0 flex items-center justify-center bg-red-900/90 z-40">
                   <div className="text-center p-4">
                    <XCircle className="h-8 w-8 text-white mx-auto mb-2" />
                    <p className="text-white font-semibold">{validationMessage || 'Failed to load models.'}</p>
                    <p className="text-gray-300 mt-1 text-sm">Please refresh or check console.</p>
                   </div>
                </div>
            )}
            {/* Display Camera Setup Errors */}
            {cameraError && !loadingModels && (
                 <div className="absolute inset-0 flex items-center justify-center bg-red-900/80 z-40">
                     {/* Similar display as model load error */}
                     <p className="text-white">{cameraError}</p>
                 </div>
            )}


            {/* 2. Camera Feed or Captured Image */}
            <div className="relative w-full h-full z-10">
              {showCamera ? (
                <CameraObject
                  ref={cameraRef}
                  onCapture={handleCapture} // Uses the new async handler with cropping
                  onStreamReady={handleStreamReady}
                  // onError={setCameraError} // Pass camera errors up if needed
                />
              ) : capturedImage ? (
                 // Display captured (and cropped) image
                 <img
                    src={capturedImage}
                    alt="Captured"
                    className="w-full h-full object-cover"
                  />
              ) : null /* Placeholder while loading/error shown */}
            </div>


             {/* 3. Live Validation Overlay (Only when camera active in register mode) */}
             {mode === 'register' && showCamera && modelsLoaded && !cameraError && (
                 <div className="absolute inset-0 z-20 pointer-events-none"> {/* Overlay doesn't block clicks */}
                    {/* Centering Guide Example (optional but helpful) */}
                    <div className="absolute inset-0 flex items-center justify-center">
                         <div className={`border-2 dashed rounded-full transition-colors duration-300
                             ${validationStatus === 'valid' ? 'border-green-500/80' : ''}
                             ${validationStatus === 'no_face' || validationStatus === 'multiple_faces' ? 'border-red-500/80' : ''}
                             ${validationStatus === 'off_center' ? 'border-yellow-500/80' : ''}
                             ${validationStatus === 'detecting' ? 'border-blue-500/50 animate-pulse' : ''}
                             ${validationStatus === 'idle' || validationStatus === 'error' ? 'border-transparent' : ''}
                             `}
                              // Adjust size based on thresholds
                              style={{
                                width: `${(1 - 2 * FACE_CENTER_THRESHOLD_X) * 100}%`,
                                height: `${(1 - 2 * FACE_CENTER_THRESHOLD_Y) * 100}%`,
                                maxWidth: '70%', // prevent guide from being too large on wider screens
                                maxHeight: '70%',
                             }}
                         ></div>
                    </div>

                    {/* Validation Status Text */}
                    {validationMessage && (
                        <div className={`absolute bottom-28 left-0 right-0 text-center p-2 transition-opacity duration-300
                            ${validationStatus === 'error' ? 'text-red-400 font-semibold' : 'text-white/90'}
                            ${validationStatus === 'valid' ? 'text-green-400 font-bold' : ''} `} >
                            <p className="text-sm bg-black/30 px-2 py-1 rounded backdrop-blur-sm inline-block">{validationMessage}</p>
                        </div>
                    )}
                 </div>
             )}

             {/* 4. Verification Result Overlay (Only in verify mode AFTER capture/verify attempt) */}
             {mode === 'verify' && verificationResult && capturedImage && (
                 <div className={`absolute inset-0 flex flex-col items-center justify-center p-4 text-center z-30
                    ${verificationResult.success ? 'bg-green-600/80' : 'bg-red-600/80'}`}>
                    {/* ... verification result icons and text ... */}
                 </div>
             )}


            {/* --- Controls --- */}

            {/* Close Button (Always visible, ensure high z-index) */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 bg-black/50 rounded-full p-2 text-white hover:bg-black/70 transition-colors z-50"
              aria-label="Close"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Bottom Action Buttons (Visible when models loaded/no critical error) */}
            {modelsLoaded && !cameraError && !loadingModels && (
                 <div className="absolute bottom-0 left-0 right-0 flex justify-center items-center p-6 bg-gradient-to-t from-black/70 to-transparent z-30">
                    {!capturedImage ? (
                        // Mode: Camera Active - Show Capture Button (Register) or placeholder (Verify)
                         mode === 'register' ? (
                            <button
                                type="button"
                                onClick={handleTakePhoto}
                                disabled={isCaptureDisabled} // Use derived state
                                className={`p-4 rounded-full border-4 transition-all duration-300
                                            ${isCaptureDisabled
                                                ? 'bg-gray-400 border-gray-500 cursor-not-allowed'
                                                : 'bg-white hover:bg-gray-200 border-gray-300 animate-pulse' // Pulse when ready
                                            }`}
                                aria-label="Take photo"
                            >
                                <Camera className={`h-8 w-8 ${isCaptureDisabled ? 'text-gray-600' : 'text-gray-800'}`} />
                            </button>
                         ) : (
                             // Placeholder or specific button for Verify mode's live state if needed later
                              <button type="button" onClick={handleTakePhoto} className="p-4 bg-white rounded-full ...">...</button> // Original Verify capture button
                         )

                    ) : (
                        // Mode: Image Captured - Show Retake & Confirm/Verify Buttons
                        <div className="flex justify-center items-center space-x-12 w-full">
                             {/* Retake Button (Show unless verification succeeded in verify mode) */}
                            {!(mode === 'verify' && verificationResult?.success) && (
                                <button
                                    type="button"
                                    onClick={handleRetake}
                                    disabled={verifying} // Disable during verification process
                                    className="p-3 bg-white/20 text-white rounded-full hover:bg-white/30 transition-colors disabled:opacity-50"
                                    aria-label="Retake photo"
                                >
                                    <RotateCcw className="h-8 w-8" />
                                </button>
                            )}

                            {/* Confirm (Register) or Verify Button */}
                            {/* Show if no verification result yet, OR if verification failed */}
                            {(!verificationResult || (mode === 'verify' && !verificationResult.success)) && (
                                <button
                                    type="button"
                                    onClick={handleConfirmOrVerify}
                                    disabled={verifying || (mode === 'verify' && !props.referenceImage)} // Disable verify if no ref image
                                    className={`p-3 rounded-full text-white transition-colors disabled:opacity-50
                                                ${mode === 'register' ? 'bg-green-500 hover:bg-green-600' : 'bg-blue-500 hover:bg-blue-600'}`}
                                    aria-label={mode === 'register' ? 'Save photo' : 'Verify identity'}
                                >
                                    {verifying ? ( <Loader2 className="h-8 w-8 animate-spin" /> )
                                    : mode === 'register' ? ( <CheckCircle className="h-8 w-8" /> )
                                    : ( <ScanFace className="h-8 w-8" /> )}
                                </button>
                            )}
                        </div>
                    )}
                 </div>
             )}

          </div> {/* End Aspect Ratio Container */}
        </div>
      </div>
    </div>
  );
}