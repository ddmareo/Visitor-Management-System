// utils/faceapi.ts
import * as faceapi from 'face-api.js';

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
): Promise<faceapi.WithFaceDescriptor<faceapi.WithFaceLandmarks<faceapi.WithFaceDetection<{}>>>[] | null> {
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