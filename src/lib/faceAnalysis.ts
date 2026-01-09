import * as faceLandmarksDetection from "@tensorflow-models/face-landmarks-detection";
import { ensureTfjsBackendReady } from "@/lib/tfjs/ensureBackend";

type FocusState = "focused" | "neutral" | "stressed";

interface FaceAnalysisResult {
  focusState: FocusState;
  faceCount: number;
  leftEAR: number;
  rightEAR: number;
  averageEAR: number;
  isLookingAtScreen: boolean;
  confidence: number;
}

// MediaPipe FaceMesh landmark indices for eye regions
const LEFT_EYE_LANDMARKS = {
  top: [159, 160, 161],
  bottom: [145, 144, 143],
  outer: 33,
  inner: 133,
};

const RIGHT_EYE_LANDMARKS = {
  top: [386, 385, 384],
  bottom: [374, 373, 380],
  outer: 362,
  inner: 263,
};

// Nose tip landmark for head pose estimation
const NOSE_TIP = 1;
const NOSE_BRIDGE = 6;

let detector: faceLandmarksDetection.FaceLandmarksDetector | null = null;
let isInitializing = false;

// Blink tracking
const blinkHistory: number[] = [];
const MAX_BLINK_HISTORY = 60; // Track over ~60 seconds of analysis cycles
let lastEAR = 0.3;
const BLINK_THRESHOLD = 0.21;

/**
 * Initialize the face landmarks detector
 */
export async function initializeDetector(): Promise<faceLandmarksDetection.FaceLandmarksDetector> {
  if (detector) return detector;
  if (isInitializing) {
    // Wait for initialization to complete
    while (isInitializing) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    if (detector) return detector;
  }

  isInitializing = true;

  try {
    await ensureTfjsBackendReady();

    const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
    detector = await faceLandmarksDetection.createDetector(model, {
      runtime: "tfjs",
      refineLandmarks: false,
      maxFaces: 1,
    });
    return detector;
  } finally {
    isInitializing = false;
  }
}

/**
 * Dispose of the detector to free memory
 */
export async function disposeDetector(): Promise<void> {
  if (detector) {
    detector.dispose();
    detector = null;
  }
  blinkHistory.length = 0;
}

/**
 * Calculate Euclidean distance between two 3D points
 */
function distance(p1: number[], p2: number[]): number {
  return Math.sqrt(
    Math.pow(p1[0] - p2[0], 2) +
    Math.pow(p1[1] - p2[1], 2) +
    Math.pow((p1[2] || 0) - (p2[2] || 0), 2)
  );
}

/**
 * Calculate Eye Aspect Ratio (EAR) for one eye
 * EAR = (|p2-p6| + |p3-p5|) / (2 * |p1-p4|)
 */
function calculateEAR(
  keypoints: faceLandmarksDetection.Keypoint[],
  eyeLandmarks: typeof LEFT_EYE_LANDMARKS
): number {
  const outer = keypoints[eyeLandmarks.outer];
  const inner = keypoints[eyeLandmarks.inner];
  
  // Average vertical distances
  let verticalSum = 0;
  for (let i = 0; i < eyeLandmarks.top.length; i++) {
    const top = keypoints[eyeLandmarks.top[i]];
    const bottom = keypoints[eyeLandmarks.bottom[i]];
    verticalSum += distance([top.x, top.y, top.z || 0], [bottom.x, bottom.y, bottom.z || 0]);
  }
  const avgVertical = verticalSum / eyeLandmarks.top.length;

  // Horizontal distance
  const horizontal = distance(
    [outer.x, outer.y, outer.z || 0],
    [inner.x, inner.y, inner.z || 0]
  );

  if (horizontal === 0) return 0.3; // Default to open eyes if calculation fails

  return avgVertical / horizontal;
}

/**
 * Detect blink based on EAR change
 */
function detectBlink(currentEAR: number): boolean {
  const isBlink = lastEAR > BLINK_THRESHOLD && currentEAR <= BLINK_THRESHOLD;
  lastEAR = currentEAR;
  return isBlink;
}

/**
 * Get blinks per minute estimate
 */
function getBlinkRate(): number {
  if (blinkHistory.length < 5) return 15; // Default normal blink rate
  
  const recentBlinks = blinkHistory.slice(-30);
  const blinkCount = recentBlinks.filter(b => b === 1).length;
  
  // Extrapolate to per-minute rate (assuming ~2 analyses per second = 30 samples per 15 seconds)
  return blinkCount * 2;
}

/**
 * Check if user is looking at screen based on head pose
 */
function isLookingAtScreen(keypoints: faceLandmarksDetection.Keypoint[]): boolean {
  const noseTip = keypoints[NOSE_TIP];
  const noseBridge = keypoints[NOSE_BRIDGE];
  
  if (!noseTip || !noseBridge) return true;

  // Calculate nose vector direction
  const noseVector = {
    x: noseTip.x - noseBridge.x,
    y: noseTip.y - noseBridge.y,
    z: (noseTip.z || 0) - (noseBridge.z || 0),
  };

  // If nose is pointing significantly away (z component), user is looking away
  // Using a threshold based on the z-depth change relative to face size
  const zRatio = Math.abs(noseVector.z) / Math.max(Math.abs(noseVector.y), 1);
  
  return zRatio < 0.5; // Allow some head movement
}

/**
 * Determine focus state based on metrics
 */
function determineFocusState(
  averageEAR: number,
  blinkRate: number,
  lookingAtScreen: boolean
): FocusState {
  // Not looking at screen -> neutral (distracted)
  if (!lookingAtScreen) {
    return "neutral";
  }

  // Very low EAR -> drowsy/unfocused
  if (averageEAR < 0.18) {
    return "neutral";
  }

  // High blink rate -> stressed
  if (blinkRate > 25) {
    return "stressed";
  }

  // Low blink rate with open eyes -> very focused
  if (blinkRate < 12 && averageEAR > 0.22) {
    return "focused";
  }

  // Normal blink rate with open eyes -> focused
  if (blinkRate >= 12 && blinkRate <= 20 && averageEAR > 0.20) {
    return "focused";
  }

  // Medium-high blink rate -> slightly stressed
  if (blinkRate > 20 && blinkRate <= 25) {
    return "neutral";
  }

  return "neutral";
}

/**
 * Analyze face from video element
 */
export async function analyzeFace(
  video: HTMLVideoElement
): Promise<FaceAnalysisResult | null> {
  if (!detector) {
    try {
      await initializeDetector();
    } catch (error) {
      console.error("Failed to initialize detector:", error);
      return null;
    }
  }

  if (!detector || !video.videoWidth || !video.videoHeight) {
    return null;
  }

  try {
    const faces = await detector.estimateFaces(video, {
      flipHorizontal: true,
      staticImageMode: false,
    });

    if (faces.length === 0) {
      return {
        focusState: "neutral",
        faceCount: 0,
        leftEAR: 0,
        rightEAR: 0,
        averageEAR: 0,
        isLookingAtScreen: false,
        confidence: 0,
      };
    }

    if (faces.length > 1) {
      return {
        focusState: "neutral",
        faceCount: faces.length,
        leftEAR: 0,
        rightEAR: 0,
        averageEAR: 0,
        isLookingAtScreen: false,
        confidence: 0,
      };
    }

    const face = faces[0];
    const keypoints = face.keypoints;

    // Calculate EAR for both eyes
    const leftEAR = calculateEAR(keypoints, LEFT_EYE_LANDMARKS);
    const rightEAR = calculateEAR(keypoints, RIGHT_EYE_LANDMARKS);
    const averageEAR = (leftEAR + rightEAR) / 2;

    // Track blinks
    const isBlink = detectBlink(averageEAR);
    blinkHistory.push(isBlink ? 1 : 0);
    if (blinkHistory.length > MAX_BLINK_HISTORY) {
      blinkHistory.shift();
    }

    // Check if looking at screen
    const lookingAtScreen = isLookingAtScreen(keypoints);

    // Get blink rate
    const blinkRate = getBlinkRate();

    // Determine focus state
    const focusState = determineFocusState(averageEAR, blinkRate, lookingAtScreen);

    return {
      focusState,
      faceCount: 1,
      leftEAR,
      rightEAR,
      averageEAR,
      isLookingAtScreen: lookingAtScreen,
      confidence: 0.9,
    };
  } catch (error) {
    console.error("Face analysis error:", error);
    return null;
  }
}

/**
 * Get detector status
 */
export function isDetectorReady(): boolean {
  return detector !== null;
}

/**
 * Check if detector is initializing
 */
export function isDetectorInitializing(): boolean {
  return isInitializing;
}
