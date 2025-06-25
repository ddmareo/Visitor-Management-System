// utils/faceapi.ts
import * as faceapi from 'face-api.js';

// Constants for face detection/validation that could be moved to utils
export const FACE_CENTER_THRESHOLD_X = 0.45; // Allows center point within central 40% (1 - 2*0.3)
export const FACE_CENTER_THRESHOLD_Y = 0.4; // Allows center point within central 50% (1 - 2*0.25)
export const DETECTION_INTERVAL = 150; // ms between detections (adjust for performance)
export const AUTO_CAPTURE_DELAY = 2000; // ms - How long face must be valid before auto-capture

// Initialize face-api models
export async function loadFaceApiModels() {
  try {
    // In Next.js app router, we need to use the public directory for models
    const MODEL_URL = '/models';
    
    // Load all required models for face detection and recognition
    await Promise.all([
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
    ]);
    
    return true;
  } catch (error) {
    console.error('Error loading face-api models:', error);
    return false;
  }
}

// Convert base64 to HTML Image element (needed for face-api)
export function base64ToImage(base64Data: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = base64Data;
  });
}

// Correctly typed function for face detection
export async function getFaceDescriptor(
  imageData: string
): Promise<faceapi.WithFaceDescriptor<faceapi.WithFaceLandmarks<faceapi.WithFaceDetection<object>>>[] | null> {
  try {
    const img = await base64ToImage(imageData);
    
    // Detect all faces and compute descriptors
    const detections = await faceapi
      .detectAllFaces(img)
      .withFaceLandmarks()
      .withFaceDescriptors();
    
    return detections;
  } catch (error) {
    console.error('Error getting face descriptor:', error);
    return null;
  }
}

// Compare faces and return similarity score
export async function compareFaces(
  referenceImageData: string, 
  capturedImageData: string
): Promise<{ 
  isMatch: boolean; 
  score: number; 
  multipleFaces?: boolean;
  noFacesDetected?: boolean;
} | null> {
  try {
    // Get face descriptors from both images
    const referenceDescriptors = await getFaceDescriptor(referenceImageData);
    const capturedDescriptors = await getFaceDescriptor(capturedImageData);

    // Check if faces were detected in both images
    if (!referenceDescriptors || !capturedDescriptors) {
      return { 
        isMatch: false, 
        score: 0,
        noFacesDetected: true 
      };
    }

    // Check if multiple faces were detected
    if (referenceDescriptors.length > 1 || capturedDescriptors.length > 1) {
      return {
        isMatch: false,
        score: 0,
        multipleFaces: true
      };
    }

    // Check if no faces were detected
    if (referenceDescriptors.length === 0 || capturedDescriptors.length === 0) {
      return {
        isMatch: false,
        score: 0,
        noFacesDetected: true
      };
    }

    // Get the descriptors from the detected faces
    const referenceDescriptor = referenceDescriptors[0].descriptor;
    const capturedDescriptor = capturedDescriptors[0].descriptor;

    // Compare the descriptors using Euclidean distance
    const distance = faceapi.euclideanDistance(referenceDescriptor, capturedDescriptor);
    
    // Convert distance to similarity score (0-1, where 1 is perfect match)
    // Face-api uses Euclidean distance, so lower is better
    // Typical threshold for a good match is around 0.6 or lower
    const maxDistance = 1.0;
    const score = Math.max(0, 1 - distance / maxDistance);
    
    // Determine if it's a match (you can adjust this threshold)
    const threshold = 0.4; // Adjust this based on testing
    const isMatch = distance <= threshold;

    return { isMatch, score };
  } catch (error) {
    console.error('Error comparing faces:', error);
    return null;
  }
}

export async function detectFaces(
  input: HTMLVideoElement | HTMLImageElement,
  options: faceapi.SsdMobilenetv1Options | faceapi.TinyFaceDetectorOptions | undefined = undefined
): Promise<faceapi.WithFaceDetection<object>[]> {
  // Use SSD MobileNetV1 by default as it's generally a good balance
  const detectorOptions = options || new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 });

  try {
      const detections = await faceapi.detectAllFaces(input, detectorOptions);
      // Map each detection to an object with a detection property
      return detections.map(detection => ({ detection }));
  } catch (error) {
      console.error('Error during face detection:', error);
      return []; // Return empty array on error
  }
}

// Function to validate face position in frame
export function validateFacePosition(
  detection: faceapi.WithFaceDetection<object>, 
  videoWidth: number, 
  videoHeight: number
): { 
  isValid: boolean;
  status: 'valid' | 'off_center';
  message: string;
} {
  const box = detection.detection.box;
  const faceCenterX = box.x + box.width / 2;
  const faceCenterY = box.y + box.height / 2;

  const isCenteredX = faceCenterX > videoWidth * FACE_CENTER_THRESHOLD_X && 
                     faceCenterX < videoWidth * (1 - FACE_CENTER_THRESHOLD_X);
  const isCenteredY = faceCenterY > videoHeight * FACE_CENTER_THRESHOLD_Y && 
                     faceCenterY < videoHeight * (1 - FACE_CENTER_THRESHOLD_Y);

  if (isCenteredX && isCenteredY) {
    return {
      isValid: true,
      status: 'valid',
      message: 'Face positioned correctly'
    };
  } else {
    return {
      isValid: false,
      status: 'off_center',
      message: 'Please center face'
    };
  }
}

// Process detection results and get validation status
export function processFaceDetectionResults(
  detections: faceapi.WithFaceDetection<object>[], 
  videoWidth: number, 
  videoHeight: number,
  mode: 'register' | 'verify'
): {
  status: 'no_face' | 'multiple_faces' | 'valid' | 'off_center';
  message: string;
  isValid: boolean;
} {
  if (detections.length === 0) {
    return {
      status: 'no_face',
      message: 'No face detected.',
      isValid: false
    };
  } else if (detections.length > 1) {
    return {
      status: 'multiple_faces',
      message: 'Multiple faces detected.',
      isValid: false
    };
  } else {
    // Single face detected, validate position
    const positionResult = validateFacePosition(detections[0], videoWidth, videoHeight);
    
    return {
      status: positionResult.status,
      // Customize message based on mode
      message: positionResult.status === 'valid' 
        ? (mode === 'register' ? 'Ready to capture!' : 'Hold still...') 
        : positionResult.message,
      isValid: positionResult.isValid
    };
  }
}