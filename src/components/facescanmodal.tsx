// FaceScanModal.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Camera, RotateCcw, CheckCircle, XCircle, Loader2, CameraOff } from 'lucide-react';
import CameraObject, { CameraRef } from './camera'; // Assuming camera.tsx is in the same folder or adjust path
import { loadFaceApiModels, compareFaces, detectFaces, processFaceDetectionResults, AUTO_CAPTURE_DELAY, DETECTION_INTERVAL, FACE_CENTER_THRESHOLD_X, FACE_CENTER_THRESHOLD_Y } from '@/utils/faceverif'; // Assuming path
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

export default function FaceScanModal(props: FaceScanModalProps) {
  const { onClose, mode } = props; // Common props

  // State common to both modes
  const [stream, setStream] = useState<MediaStream | null>(null);
  const cameraRef = useRef<CameraRef>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Model Loading
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [loadingModels, setLoadingModels] = useState(true);

  // Live Validation & Auto-Capture (Used by both modes now)
  const [validationStatus, setValidationStatus] = useState<ValidationStatus>('idle');
  const [validationMessage, setValidationMessage] = useState<string | null>('Initializing...');
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isDetectingRef = useRef(false);
  const validStartTimeRef = useRef<number | null>(null); // Ref to track when face became valid

  // Verification Specific ('verify' mode)
  const [verifying, setVerifying] = useState(false); // Tracks the compareFaces API call
  const [verificationResult, setVerificationResult] = useState<{ success: boolean; score?: number; message?: string } | null>(null);
  const verificationInProgressRef = useRef(false); // Flag to prevent re-triggering auto-capture while one is processing

    // --- Detection Loop Function ---
    const startDetectionLoop = useCallback((videoElement: HTMLVideoElement) => {
        if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
        isDetectingRef.current = false;
        validStartTimeRef.current = null; // Reset timer when loop starts/restarts

        detectionIntervalRef.current = setInterval(async () => {
        if (!cameraRef.current?.videoElement || videoElement.paused || videoElement.ended || !modelsLoaded || isDetectingRef.current || verificationInProgressRef.current) {
            return; // Skip if busy, paused, ended, models unloaded, or verification running
        }

        if (videoElement.readyState < videoElement.HAVE_CURRENT_DATA) return; // Skip if not enough data

        isDetectingRef.current = true;

        try {
            const detectionOptions = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 });

            const detections = await detectFaces(videoElement, detectionOptions);
            const videoWidth = videoElement.videoWidth;
            const videoHeight = videoElement.videoHeight;

            const validationResult = processFaceDetectionResults(
                detections, 
                videoWidth, 
                videoHeight, 
                mode
            );

            // Update state for UI feedback
            setValidationStatus(validationResult.status);
            setValidationMessage(validationResult.message);

            // --- Auto-Capture Logic (Verify Mode Only) ---
            if (mode === 'verify' && validationResult.status === 'valid') {
            if (validStartTimeRef.current === null) {
                // Start timer
                validStartTimeRef.current = Date.now();
            } else {
                // Timer running, check if delay exceeded
                if (Date.now() - validStartTimeRef.current >= AUTO_CAPTURE_DELAY) {
                // Threshold met, trigger capture and verification
                console.log("Auto-capture threshold met.");
                validStartTimeRef.current = null; // Reset timer immediately
                if (!verificationInProgressRef.current) { // Double check flag
                    cameraRef.current?.captureImage(); // Trigger capture
                    // handleCapture will now initiate the verification flow
                }
                }
            }
            } else {
            // Status is not 'valid', reset timer
            validStartTimeRef.current = null;
            }

        } catch (error) {
            console.error('Error during face detection loop:', error);
            setValidationStatus('error');
            setValidationMessage('Detection error occurred.');
            validStartTimeRef.current = null; // Reset timer on error
        } finally {
            isDetectingRef.current = false;
        }
        }, DETECTION_INTERVAL);
    }, [mode, modelsLoaded, cameraRef, setValidationStatus, setValidationMessage]);
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

    // In the useEffect section, add startDetectionLoop to the dependency array
    useEffect(() => {
        const cleanupDetection = () => {
        if (detectionIntervalRef.current) {
            clearInterval(detectionIntervalRef.current);
            detectionIntervalRef.current = null;
        }
        isDetectingRef.current = false;
        validStartTimeRef.current = null; // Reset timer on cleanup
        };

        // Run loop if models loaded, stream ready, and video element exists
        // Also check for cameraError
        if (modelsLoaded && stream && cameraRef.current?.videoElement && !cameraError && !loadingModels) {
        const videoElement = cameraRef.current.videoElement;

        // Check if verification is already completed (success/fail) - if so, don't restart loop unless retried
        if (mode === 'verify' && verificationResult) {
            cleanupDetection();
            return;
        }


        const checkVideoAndStart = () => {
            if (videoElement.readyState >= videoElement.HAVE_METADATA) {
                startDetectionLoop(videoElement);
            } else {
                setValidationMessage("Waiting for video...");
                videoElement.addEventListener('loadedmetadata', () => startDetectionLoop(videoElement), { once: true });
            }
        };

        // Ensure verification reference image exists for verify mode before starting loop
        if (mode === 'verify') {
            const verifyProps = props as VerifyProps; // Type assertion
            if (!verifyProps.referenceImage) {
                setValidationStatus('error');
                setValidationMessage('Reference image missing for verification.');
                cleanupDetection();
                return; // Don't start loop if reference is missing
            }
        }

        checkVideoAndStart();

        } else {
        cleanupDetection(); // Conditions not met, ensure loop is stopped
        if (!modelsLoaded && !loadingModels) { setValidationMessage("Models failed to load."); setValidationStatus('error'); }
        else if (!stream && !loadingModels) { setValidationMessage("Initializing camera..."); setValidationStatus('idle'); }
        else if (cameraError) { setValidationMessage(cameraError); setValidationStatus('error');}
        }

        return cleanupDetection; // Cleanup on unmount or dependency change
    }, [mode, modelsLoaded, loadingModels, stream, cameraRef, cameraError, verificationResult, props, startDetectionLoop]); // Added startDetectionLoop here

    // --- Handlers ---

    const handleStreamReady = useCallback((mediaStream: MediaStream) => {
        setStream(mediaStream);
        setCameraError(null);
        setValidationStatus('detecting');
        setValidationMessage('Detecting face...');
    }, [setStream, setCameraError, setValidationStatus, setValidationMessage]);
  
    // Modified Capture Handler
    const handleCapture = async (rawImageData: string) => {
        // Stop detection *timer* but not necessarily the loop itself for verify mode
        validStartTimeRef.current = null;

        if (mode === 'register') {
            // Stop full detection loop for register mode after capture
            if (detectionIntervalRef.current) {
                console.log("Register Capture: Stopping detection loop.");
                clearInterval(detectionIntervalRef.current);
                detectionIntervalRef.current = null;
            }
            isDetectingRef.current = false;

            try {
                console.log("Register: Cropping image...");
                const croppedImageData = await cropImageToAspectRatio(rawImageData, TARGET_ASPECT_RATIO);
                // Set the capturedImage state for preview in register mode
                setCapturedImageState(croppedImageData);
                console.log("Register: Crop successful. Showing preview.");
                // Clear validation message now that preview is shown
                setValidationMessage('');
                setValidationStatus('idle'); // Reset status after capture
            } catch (error) {
                console.error("Register: Failed to crop captured image:", error);
                setValidationStatus('error');
                setValidationMessage('Image processing failed.');
            }
        } else if (mode === 'verify') {
            if (verificationInProgressRef.current) {
                console.log("Verification already in progress, skipping new capture trigger.");
                return; // Avoid race conditions
            }
            verificationInProgressRef.current = true; // Set flag
            setVerifying(true); // Update state for UI loading indicator
            setValidationMessage("Verifying..."); // Update UI message

            try {
                console.log("Verify: Cropping image...");
                const croppedImageData = await cropImageToAspectRatio(rawImageData, TARGET_ASPECT_RATIO);
                console.log("Verify: Crop successful. Comparing faces...");
                await performVerification(croppedImageData); // Call verification logic
            } catch (error) {
                console.error("Verify: Failed to crop or verify image:", error);
                setVerificationResult({ success: false, message: 'Image processing or verification failed.' });
                setVerifying(false);
                verificationInProgressRef.current = false; // Reset flag on error
                // Keep validation message or update?
                setValidationMessage('Verification failed.'); // Update message
                // Don't restart loop here, let the retry mechanism handle it
            }
        }
    };

     // Extracted state setting for register mode preview
    const [capturedImageState, setCapturedImageState] = useState<string | null>(null);

    // Verification Logic Function
    const performVerification = async (capturedCroppedData: string) => {
        const verifyProps = props as VerifyProps; // Type assertion needed for props access
        if (!verifyProps.referenceImage) {
            console.error("Verification aborted: Reference image missing.");
            setVerificationResult({ success: false, message: "Reference image missing." });
            setVerifying(false);
            verificationInProgressRef.current = false;
            return;
        }

        try {
            const result = await compareFaces(verifyProps.referenceImage, capturedCroppedData);

            if (!result) {
                throw new Error('Face comparison failed or returned null');
            }

            let message: string | undefined = undefined;
            if (result.noFacesDetected) message = 'No face detected in verification image.'; // Should be rare due to pre-check
            else if (result.multipleFaces) message = 'Multiple faces detected in verification image.'; // Should be rare
            else if (!result.isMatch) message = 'Verification Failed.';
            else message = 'Verification Successful!';

            const finalResult = { success: result.isMatch, score: result.score, message: message };
            setVerificationResult(finalResult);

            if (finalResult.success && props.onVerificationComplete) {
                props.onVerificationComplete(finalResult.success, finalResult.score);
                setTimeout(onClose, 1500); // Auto close on success
            } else if (!finalResult.success && props.onVerificationComplete) {
                props.onVerificationComplete(finalResult.success, finalResult.score);
                // Don't auto-close on failure, wait for retry/manual close
            }

        } catch (error) {
            console.error('Verification error:', error);
            setVerificationResult({ success: false, message: 'An error occurred during comparison.' });
            if (props.mode === 'verify' && props.onVerificationComplete) {
                props.onVerificationComplete(false);
            }
        } finally {
            setVerifying(false); // Clear loading state
            verificationInProgressRef.current = false; // Reset flag ONLY after processing finishes
        }
    };

    const handleRetake = () => {
        setCapturedImageState(null); // Clear register preview if any
        setVerificationResult(null); // Clear verification result
        setVerifying(false); // Ensure verifying state is off
        verificationInProgressRef.current = false; // Reset flag
        validStartTimeRef.current = null; // Reset timer

        // Restart detection loop (effect 3 will handle this based on state changes)
        // Explicitly reset validation status to trigger loop restart if needed
        setValidationStatus('idle');
        setValidationMessage('Retrying...');
        // The useEffect[3] dependency on verificationResult being null should re-trigger the loop start
   };
    
    // Register Mode: Confirm Button Handler
    const handleRegisterConfirm = () => {
        if (mode === 'register' && props.mode === 'register' && capturedImageState) {
        props.onRegisterConfirm(capturedImageState);
        onClose();
        }
    };

    // --- Derived State / Render Flags ---
    const isRegisterCaptureDisabled = mode === 'register' && validationStatus !== 'valid';
    const showRegisterPreview = mode === 'register' && !!capturedImageState; // True if in register mode AND image is captured

    // Show camera view if: not loading models, no camera error, AND
    // ( (it's register mode AND we are NOT showing the preview) OR
    //   (it's verify mode AND verification hasn't successfully completed yet) )
    const showCameraView = !loadingModels && !cameraError &&
                           ( (mode === 'register' && !showRegisterPreview) ||
                             (mode === 'verify' && !verificationResult?.success) );

  // --- Render Logic ---

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-transparent p-4 w-full h-full max-w-xl mx-4">
        <div className="relative w-full h-full max-h-full flex items-center justify-center">
          {/* Aspect Ratio Container */}
          <div className="aspect-[3/4] bg-gray-900 rounded-lg overflow-hidden relative shadow-lg  w-full h-auto max-h-[95vh] max-w-md
                      md:max-h-[90vh] md:w-auto md:h-[90vh]">

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
                {showCameraView ? (
                    <CameraObject
                        ref={cameraRef}
                        onCapture={handleCapture}
                        onStreamReady={handleStreamReady}
                    />
                ) : showRegisterPreview ? ( // Check specific flag for register preview
                    // Show preview ONLY in register mode after capture
                    <img
                        src={capturedImageState}
                        alt="Captured"
                        className="w-full h-full object-cover"
                    />
                ) : mode === 'verify' && verificationResult?.success ? (
                    // Optional: Show verify success confirmation
                    <div className="w-full h-full flex flex-col items-center justify-center bg-green-600/90">
                        <CheckCircle className="h-16 w-16 text-white mb-4" />
                        <p className="text-white text-xl font-semibold">Verified!</p>
                    </div>
                 ) : (
                     // Fallback (e.g., camera error state shown by overlay, verify success before close)
                      <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                          <CameraOff className="h-12 w-12 text-gray-500" />
                      </div>
                 )}
            </div>

            {/* 3. Live Validation & Verification Status Overlays (Over camera) */}
            {/* A. Show Live Validation Guide & Text (when camera active AND not verifying AND no final result) */}
            {showCameraView && !verifying && !verificationResult && (
                 <div className="absolute inset-0 z-20 pointer-events-none"> {/* Guide Overlay */}
                    {/* Centering Guide Ellipse */}
                    <div className="absolute inset-0 flex items-center justify-center">
                         <div className={`border-2 dashed rounded-full transition-colors duration-300
                             ${validationStatus === 'valid' ? 'border-green-500/80' : ''}
                             ${validationStatus === 'no_face' || validationStatus === 'multiple_faces' ? 'border-red-500/80' : ''}
                             ${validationStatus === 'off_center' ? 'border-yellow-500/80' : ''}
                             ${validationStatus === 'detecting' || validationStatus === 'idle' ? 'border-blue-500/50 animate-pulse' : ''}
                             ${validationStatus === 'error' ? 'border-red-700/70' : ''}
                             `}
                              // Adjust size based on thresholds
                              style={{
                                width: `${(1 - 2 * FACE_CENTER_THRESHOLD_X) * 500}%`,
                                height: `${(1 - 2 * FACE_CENTER_THRESHOLD_Y) * 300}%`,
                                maxWidth: '70%', // prevent guide from being too large
                                maxHeight: '70%',
                              }}
                         ></div>
                    </div>

                    {/* Validation Status Text */}
                    {validationMessage && (
                        <div className={`absolute top-16 left-0 right-0 text-center p-2 transition-opacity duration-300
                            ${validationStatus === 'error' ? 'text-red-400 font-semibold' : 'text-white/90'}
                            ${validationStatus === 'valid' ? (mode === 'register' ? 'text-green-400 font-bold' : 'text-blue-300 font-semibold') : ''}
                             `} >
                            <p className="text-sm bg-black/40 px-2 py-1 rounded backdrop-blur-sm inline-block">{validationMessage}</p>
                        </div>
                    )}
                 </div>
             )}

            {/* B. Show Verification Processing / Final Result Overlay (Verify Mode Only) */}
            {mode === 'verify' && (verifying || verificationResult) && (
                 // This overlay uses z-30, so it appears *above* the z-20 guide when active
                 <div className={`absolute inset-0 z-30 flex flex-col items-center justify-center p-4 text-center transition-opacity duration-300
                    ${verifying ? 'bg-black/60 backdrop-blur-sm' : ''}
                    ${verificationResult && !verificationResult.success ? 'bg-red-600/50' : ''}
                    ${verificationResult && verificationResult.success ? 'bg-green-600/50' : ''} `}>

                    {/* Spinner when verifying */}
                    {verifying && !verificationResult && (
                         <>
                             <Loader2 className="h-10 w-10 text-blue-400 animate-spin mb-3" />
                             <p className="text-white font-semibold">{validationMessage || 'Verifying...'}</p>
                         </>
                    )}

                    {/* Result Icons/Text/Retry when verificationResult exists */}
                    {verificationResult && !verifying && (
                        <>
                            {verificationResult.success ? ( <CheckCircle className="h-16 w-16 text-white mb-2" /> )
                             : ( <XCircle className="h-16 w-16 text-white mb-2" /> )}

                            {verificationResult.message && ( <p className="text-white font-semibold mb-1">{verificationResult.message}</p> )}

                            {/* Score display */}
                            {verificationResult.score !== undefined && !verificationResult.success && (
                                <p className="text-white text-sm opacity-80"> (Score: {(verificationResult.score * 100).toFixed(1)}%) </p>
                            )}

                            {/* Retry Button on Failure */}
                            {!verificationResult.success && (
                                 <button type="button" onClick={handleRetake} className="mt-4 px-4 py-2 bg-white/20 ...">
                                     <RotateCcw className="inline-block h-4 w-4 mr-1" /> Retry Scan
                                 </button>
                             )}
                        </>
                    )}
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
            {/* Show only when models loaded, no fatal error, and no verification in progress/result shown (except for retry) */}
            {modelsLoaded && !cameraError && !loadingModels && (!verifying && !verificationResult) && (
                 <div className="absolute bottom-0 left-0 right-0 flex justify-center items-center p-6 bg-gradient-to-t from-black/70 to-transparent z-30">
                    {mode === 'register' && !capturedImageState && ( // Register mode, before capture
                        <button
                            type="button"
                            onClick={() => cameraRef.current?.captureImage()} // Direct capture trigger
                            disabled={isRegisterCaptureDisabled}
                            className={`p-4 rounded-full border-4 transition-all duration-300 ... ${isRegisterCaptureDisabled ? '...' : '... animate-pulse'}`}
                            aria-label="Take photo"
                        >
                            <Camera className={`h-8 w-8 ${isRegisterCaptureDisabled ? '...' : '...'}`} />
                        </button>
                    )}
                     {mode === 'register' && capturedImageState && ( // Register mode, after capture
                         <div className="flex justify-center items-center space-x-12 w-full">
                            <button type="button" onClick={handleRetake} className="p-3 bg-white/20 ..."><RotateCcw/></button>
                            <button type="button" onClick={handleRegisterConfirm} className="p-3 bg-green-500 ..."><CheckCircle/></button>
                         </div>
                     )}
                     {/* No explicit button needed for verify mode's initial state - it's automatic */}
                 </div>
             )}

          </div> {/* End Aspect Ratio Container */}
        </div>
      </div>
    </div>
  );
}