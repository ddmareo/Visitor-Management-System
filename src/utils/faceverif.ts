import { FaceLandmarker, FaceLandmarkerResult, FilesetResolver } from '@mediapipe/tasks-vision';

export type FaceMetrics = {
  similarity: number;
  confidence: number;
  landmarks: {
    matched: number;
    total: number;
  };
  qualityScore: number;
};

export type SerializedBuffer = {
  data: number[];
  type: "Buffer";
};

const SIMILARITY_THRESHOLD = 0.75;
const CONFIDENCE_THRESHOLD = 0.8;

export async function initializeFaceLandmarker(): Promise<FaceLandmarker> {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
  );

  return await FaceLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
      delegate: "GPU"
    },
    outputFaceBlendshapes: true,
    outputFacialTransformationMatrixes: true,
    runningMode: "VIDEO"
  });
}

async function serializedBufferToImageData(serializedBuffer: SerializedBuffer): Promise<ImageData> {
  // Convert the serialized buffer data back to a proper Buffer/Uint8Array
  const buffer = new Uint8Array(serializedBuffer.data);
  
  // Convert to base64
  let binary = '';
  buffer.forEach(byte => {
    binary += String.fromCharCode(byte);
  });
  const base64String = btoa(binary);
  const dataURL = `data:image/jpeg;base64,${base64String}`;
  
  // Create and load image
  const img = new Image();
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = dataURL;
  });

  // Convert to ImageData
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

function calculateMetrics(
  liveFace: FaceLandmarkerResult,
  referenceFace: FaceLandmarkerResult
): FaceMetrics {
  const liveLandmarks = liveFace.faceLandmarks[0];
  const refLandmarks = referenceFace.faceLandmarks[0];

  const distances = liveLandmarks.map((landmark, i) => {
    const refLandmark = refLandmarks[i];
    return Math.sqrt(
      Math.pow(landmark.x - refLandmark.x, 2) +
      Math.pow(landmark.y - refLandmark.y, 2) +
      Math.pow(landmark.z - refLandmark.z, 2)
    );
  });

  const similarity = 1 - (distances.reduce((a, b) => a + b) / distances.length);
  const confidence = (liveFace.faceBlendshapes?.[0]?.categories?.[0]?.score ?? 0);

  return {
    similarity,
    confidence,
    landmarks: {
      matched: distances.filter(d => d < 0.1).length,
      total: distances.length
    },
    qualityScore: similarity * confidence
  };
}

export async function compareFaces(
  faceLandmarker: FaceLandmarker,
  liveImageBuffer: SerializedBuffer,
  referenceImageBuffer: SerializedBuffer
): Promise<FaceMetrics | null> {
  try {
    // Convert both buffers to ImageData
    const [liveImage, referenceImage] = await Promise.all([
      serializedBufferToImageData(liveImageBuffer),
      serializedBufferToImageData(referenceImageBuffer)
    ]);
    
    // Get face landmarks for both images
    const liveFace = await faceLandmarker.detect(liveImage);
    const referenceFace = await faceLandmarker.detect(referenceImage);

    if (!liveFace.faceLandmarks?.[0] || !referenceFace.faceLandmarks?.[0]) {
      return null; // No face detected in one or both images
    }

    return calculateMetrics(liveFace, referenceFace);
  } catch (error) {
    console.error('Error comparing faces:', error);
    return null;
  }
}

export function isGoodMatch(metrics: FaceMetrics): boolean {
  return (
    metrics.similarity >= SIMILARITY_THRESHOLD &&
    metrics.confidence >= CONFIDENCE_THRESHOLD
  );
}