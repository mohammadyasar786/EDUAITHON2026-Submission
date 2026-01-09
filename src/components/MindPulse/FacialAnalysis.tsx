import { useState, useRef, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Camera, CameraOff, AlertCircle, Smile, Frown, Meh, Wind, Coffee, Eye, Loader2, UserX, Users, Brain } from "lucide-react";
import { toast } from "sonner";
import { 
  initializeDetector, 
  disposeDetector, 
  analyzeFace as analyzeWithTensorFlow,
  isDetectorReady,
  isDetectorInitializing
} from "@/lib/faceAnalysis";

interface FacialAnalysisProps {
  onFocusUpdate: (focus: "focused" | "neutral" | "stressed") => void;
  isMonitoring: boolean;
}

type FocusState = "focused" | "neutral" | "stressed";
type CameraStatus = "idle" | "requesting" | "active" | "error" | "denied";
type FaceDetectionStatus = "detecting" | "found" | "no_face" | "multiple_faces";
type ModelStatus = "idle" | "loading" | "ready" | "error";

interface AnalysisResult {
  focus: FocusState;
  timestamp: number;
}

const FacialAnalysis = ({ onFocusUpdate, isMonitoring }: FacialAnalysisProps) => {
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>("idle");
  const [modelStatus, setModelStatus] = useState<ModelStatus>("idle");
  const [hasConsent, setHasConsent] = useState(false);
  const [showConsentDialog, setShowConsentDialog] = useState(false);
  const [currentFocus, setCurrentFocus] = useState<FocusState>("neutral");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [faceDetectionStatus, setFaceDetectionStatus] = useState<FaceDetectionStatus>("detecting");
  const [analysisMessage, setAnalysisMessage] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  
  // Store recent analysis results for averaging
  const recentResultsRef = useRef<AnalysisResult[]>([]);
  const MAX_RESULTS_FOR_AVERAGE = 5;

  // Reduce false "No face" warnings by requiring a short streak of misses
  const noFaceStreakRef = useRef(0);
  const multiFaceStreakRef = useRef(0);
  const REQUIRED_STREAK = 3;
  
  // Track last notified state to avoid duplicate notifications
  const lastNotifiedStateRef = useRef<FocusState | null>(null);

  // Cleanup function
  const cleanup = useCallback(() => {
    // Stop analysis interval
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current);
      analysisIntervalRef.current = null;
    }

    // Stop camera stream
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach(track => {
          track.stop();
        });
      } catch (e) {
        console.warn("Error stopping camera tracks:", e);
      }
      streamRef.current = null;
    }

    // Clear video source
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsVideoReady(false);
    setFaceDetectionStatus("detecting");
    setAnalysisMessage(null);
    recentResultsRef.current = [];
    noFaceStreakRef.current = 0;
    multiFaceStreakRef.current = 0;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      cleanup();
      // Dispose TensorFlow detector
      disposeDetector();
    };
  }, [cleanup]);

  // Initialize TensorFlow model
  const initializeModel = useCallback(async () => {
    if (isDetectorReady() || isDetectorInitializing()) return;
    
    setModelStatus("loading");
    try {
      await initializeDetector();
      if (isMountedRef.current) {
        setModelStatus("ready");
      }
    } catch (error) {
      console.error("Failed to initialize TensorFlow model:", error);
      if (isMountedRef.current) {
        setModelStatus("error");
        setErrorMessage("Failed to load AI model. Please refresh and try again.");
      }
    }
  }, []);

  // Calculate averaged focus state from recent results
  const calculateAveragedFocus = useCallback((): FocusState => {
    const results = recentResultsRef.current;
    if (results.length === 0) return "neutral";
    
    const counts = { focused: 0, neutral: 0, stressed: 0 };
    results.forEach(r => counts[r.focus]++);
    
    // Return the most common state
    if (counts.focused >= counts.neutral && counts.focused >= counts.stressed) {
      return "focused";
    } else if (counts.stressed >= counts.neutral) {
      return "stressed";
    }
    return "neutral";
  }, []);

  // Real facial analysis with TensorFlow.js
  const analyzeFace = useCallback(async () => {
    if (!isMountedRef.current) return;
    if (cameraStatus !== "active" || !isMonitoring || !isVideoReady) return;
    if (!videoRef.current) return;
    if (modelStatus !== "ready") return;
    
    try {
      const result = await analyzeWithTensorFlow(videoRef.current);
      
      if (!result || !isMountedRef.current) return;

       if (result.faceCount === 0) {
         noFaceStreakRef.current += 1;
         multiFaceStreakRef.current = 0;

         // Avoid flashing "no face" due to occasional missed frames
         if (noFaceStreakRef.current < REQUIRED_STREAK) return;

         console.debug("[MindPulse] No face detected", {
           streak: noFaceStreakRef.current,
           video: {
             width: videoRef.current?.videoWidth,
             height: videoRef.current?.videoHeight,
             readyState: videoRef.current?.readyState,
           },
         });

         setFaceDetectionStatus("no_face");
          setAnalysisMessage(null); // Don't show notification when no face detected
         return;
       }

       if (result.faceCount > 1) {
         multiFaceStreakRef.current += 1;
         noFaceStreakRef.current = 0;

         if (multiFaceStreakRef.current < REQUIRED_STREAK) return;

         console.debug("[MindPulse] Multiple faces detected", {
           streak: multiFaceStreakRef.current,
           faceCount: result.faceCount,
         });

         setFaceDetectionStatus("multiple_faces");
         setAnalysisMessage("Multiple faces detected. Analysis works best with one person.");
         return;
       }

       // Reset streaks once exactly one face is detected
       noFaceStreakRef.current = 0;
       multiFaceStreakRef.current = 0;
       
       // Face found - update state
       setFaceDetectionStatus("found");
       setAnalysisMessage(null);
      
      // Add to recent results for averaging
      recentResultsRef.current.push({ focus: result.focusState, timestamp: Date.now() });
      
      // Keep only recent results
      if (recentResultsRef.current.length > MAX_RESULTS_FOR_AVERAGE) {
        recentResultsRef.current.shift();
      }
      
      // Calculate averaged result
      const averagedFocus = calculateAveragedFocus();
      
      if (isMountedRef.current) {
        setCurrentFocus(averagedFocus);
        onFocusUpdate(averagedFocus);
        
        // Show notification when state changes
        if (lastNotifiedStateRef.current !== averagedFocus) {
          lastNotifiedStateRef.current = averagedFocus;
          
          if (averagedFocus === "stressed") {
            toast.warning("😟 You appear stressed. Consider taking a short break.", {
              duration: 5000,
            });
          } else if (averagedFocus === "focused") {
            toast.success("🎯 Great focus! You're in the zone.", {
              duration: 3000,
            });
          } else if (averagedFocus === "neutral") {
            toast.info("😐 Neutral state detected. Stay engaged!", {
              duration: 3000,
            });
          }
        }
      }
    } catch (error) {
      console.warn("Analysis error:", error);
      if (isMountedRef.current) {
        setAnalysisMessage("Analysis temporarily unavailable. Retrying...");
      }
    }
  }, [cameraStatus, isMonitoring, isVideoReady, modelStatus, onFocusUpdate, calculateAveragedFocus]);

  // Analysis interval effect
  useEffect(() => {
    if (cameraStatus === "active" && isMonitoring && isVideoReady && modelStatus === "ready") {
      // Run analysis every 500ms for smooth real-time feedback
      analysisIntervalRef.current = setInterval(analyzeFace, 500);
      // Initial analysis after a short delay
      const timeout = setTimeout(analyzeFace, 500);
      
      return () => {
        if (analysisIntervalRef.current) {
          clearInterval(analysisIntervalRef.current);
          analysisIntervalRef.current = null;
        }
        clearTimeout(timeout);
      };
    }
  }, [cameraStatus, isMonitoring, isVideoReady, modelStatus, analyzeFace]);

  // Handle video element ready
  const handleVideoCanPlay = useCallback(() => {
    if (isMountedRef.current) {
      setIsVideoReady(true);
      setFaceDetectionStatus("detecting");
    }
  }, []);

  // Request camera access
  const requestCameraAccess = async () => {
    if (!isMountedRef.current) return;
    
    setCameraStatus("requesting");
    setErrorMessage(null);
    setIsVideoReady(false);
    setFaceDetectionStatus("detecting");
    setAnalysisMessage(null);
    
    // Start loading the TensorFlow model in parallel
    initializeModel();
    
    try {
      // Check if mediaDevices is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera not supported on this device.");
      }

       const stream = await navigator.mediaDevices.getUserMedia({ 
         video: { 
           facingMode: "user", 
           width: { ideal: 640, min: 480 }, 
           height: { ideal: 480, min: 360 },
           frameRate: { ideal: 30, min: 15 }
         } 
       });
      
      if (!isMountedRef.current) {
        // Component unmounted during request - cleanup
        stream.getTracks().forEach(track => track.stop());
        return;
      }

      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current && isMountedRef.current) {
            videoRef.current.play().catch(e => {
              console.warn("Video play error:", e);
            });
          }
        };
      }
      
      setCameraStatus("active");
      toast.success("Camera enabled for AI-powered wellness monitoring");
    } catch (error: any) {
      console.warn("Camera access error:", error);
      
      if (!isMountedRef.current) return;
      
      let message = "Camera access not enabled.";
      
      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        message = "Camera permission denied. You can enable it in your browser settings.";
        setCameraStatus("denied");
      } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
        message = "No camera found on this device.";
        setCameraStatus("error");
      } else if (error.name === "NotReadableError" || error.name === "TrackStartError") {
        message = "Camera is in use by another application.";
        setCameraStatus("error");
      } else if (error.message) {
        message = error.message;
        setCameraStatus("error");
      } else {
        setCameraStatus("error");
      }
      
      setErrorMessage(message);
    }
  };

  // Disable camera
  const disableCamera = useCallback(() => {
    cleanup();
    setCameraStatus("idle");
    setCurrentFocus("neutral");
    setErrorMessage(null);
    toast.info("Camera disabled");
  }, [cleanup]);

  // Handle consent grant
  const handleConsentGrant = () => {
    setHasConsent(true);
    setShowConsentDialog(false);
    requestCameraAccess();
  };

  // Handle enable camera button click
  const handleEnableCamera = () => {
    if (hasConsent) {
      requestCameraAccess();
    } else {
      setShowConsentDialog(true);
    }
  };

  // Retry analysis manually
  const handleRetryAnalysis = () => {
    setAnalysisMessage(null);
    setFaceDetectionStatus("detecting");
    recentResultsRef.current = [];
    analyzeFace();
  };

  const getFocusIcon = () => {
    switch (currentFocus) {
      case "focused":
        return <Eye className="h-5 w-5 text-green-500" />;
      case "stressed":
        return <Frown className="h-5 w-5 text-red-500" />;
      default:
        return <Meh className="h-5 w-5 text-amber-500" />;
    }
  };

  const getFocusBadge = () => {
    switch (currentFocus) {
      case "focused":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Focused</Badge>;
      case "stressed":
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Stressed</Badge>;
      default:
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">Neutral</Badge>;
    }
  };

  const getFaceDetectionBadge = () => {
    switch (faceDetectionStatus) {
      case "multiple_faces":
        return (
          <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 gap-1">
            <Users className="h-3 w-3" />
            Multiple
          </Badge>
        );
      default:
        return null;
    }
  };

  const getWellnessSuggestion = () => {
    switch (currentFocus) {
      case "stressed":
        return {
          icon: <Wind className="h-5 w-5 text-blue-500" />,
          title: "Take a breather",
          message: "Try deep breathing: Inhale 4 seconds, hold 4, exhale 4"
        };
      case "neutral":
        return {
          icon: <Coffee className="h-5 w-5 text-amber-500" />,
          title: "Stay engaged",
          message: "Consider a short break or switch to a different topic"
        };
      default:
        return {
          icon: <Smile className="h-5 w-5 text-green-500" />,
          title: "Great focus!",
          message: "You're in the zone. Keep up the excellent work!"
        };
    }
  };

  // Consent Dialog
  if (showConsentDialog) {
    return (
      <Card className="p-6 border-2 border-primary/20">
        <div className="text-center space-y-4">
          <div className="inline-flex p-4 rounded-full bg-primary/10">
            <Camera className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-bold">Enable AI-Powered Wellness Monitoring?</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            MindPulse uses TensorFlow.js to analyze facial landmarks and provide 
            real-time focus and stress feedback. This helps personalize your learning experience.
          </p>
          
          <div className="bg-muted/50 rounded-lg p-4 text-left space-y-2 max-w-md mx-auto">
            <h4 className="font-semibold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-blue-500" />
              Privacy Guarantee
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
              <li>No images or video are stored or transmitted</li>
              <li>All AI processing happens locally on your device</li>
              <li>Uses industry-standard TensorFlow.js face mesh detection</li>
              <li>You can disable the camera at any time</li>
            </ul>
          </div>
          
          <div className="flex gap-3 justify-center pt-2">
            <Button variant="outline" onClick={() => setShowConsentDialog(false)}>
              No Thanks
            </Button>
            <Button onClick={handleConsentGrant} className="bg-primary text-primary-foreground">
              Enable Camera
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  const suggestion = getWellnessSuggestion();
  const isActive = cameraStatus === "active";
  const faceDetectionBadge = getFaceDetectionBadge();

  return (
    <Card className="p-6 border-2">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isActive ? (
              <Camera className="h-5 w-5 text-green-500" />
            ) : (
              <CameraOff className="h-5 w-5 text-muted-foreground" />
            )}
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                AI Facial Analysis
                <Badge variant="outline" className="text-xs gap-1">
                  <Brain className="h-3 w-3" />
                  TensorFlow.js
                </Badge>
              </h3>
              <p className="text-xs text-muted-foreground">Real-time wellness monitoring</p>
            </div>
          </div>
          
          {/* Enable/Disable Button */}
          {isActive ? (
            <Button variant="outline" size="sm" onClick={disableCamera}>
              <CameraOff className="h-4 w-4 mr-2" />
              Disable Camera
            </Button>
          ) : (
            <Button 
              size="sm" 
              onClick={handleEnableCamera}
              disabled={cameraStatus === "requesting"}
              className="bg-primary text-primary-foreground"
            >
              {cameraStatus === "requesting" ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <Camera className="h-4 w-4 mr-2" />
                  Enable AI Camera
                </>
              )}
            </Button>
          )}
        </div>

        {/* Model Loading Status */}
        {modelStatus === "loading" && (
          <div className="flex items-center gap-2 text-primary text-sm p-3 bg-primary/10 rounded-lg">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading AI model... This may take a few seconds.</span>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="flex items-center gap-2 text-amber-600 text-sm p-3 bg-amber-500/10 rounded-lg">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Analysis Status Message */}
        {analysisMessage && isActive && isVideoReady && (
          <div className="flex items-center justify-between text-amber-600 text-sm p-3 bg-amber-500/10 rounded-lg">
            <div className="flex items-center gap-2">
              {faceDetectionStatus === "no_face" ? (
                <UserX className="h-4 w-4 flex-shrink-0" />
              ) : faceDetectionStatus === "multiple_faces" ? (
                <Users className="h-4 w-4 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
              )}
              <span>{analysisMessage}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleRetryAnalysis} className="h-7 text-xs">
              Retry
            </Button>
          </div>
        )}

        {/* Camera Preview Container - Fixed size */}
        <div 
          className="relative rounded-lg overflow-hidden bg-muted/50 mx-auto"
          style={{ width: "320px", height: "240px" }}
        >
          {/* Video Element - Always present but hidden when not active */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            onCanPlay={handleVideoCanPlay}
            className={`w-full h-full object-cover ${isActive ? "block" : "hidden"}`}
          />
          
          {/* Placeholder when camera is idle */}
          {cameraStatus === "idle" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
              <CameraOff className="h-12 w-12 mb-2 opacity-50" />
              <p className="text-sm">Camera not enabled</p>
            </div>
          )}
          
          {/* Loading state */}
          {cameraStatus === "requesting" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
              <Loader2 className="h-12 w-12 mb-2 animate-spin" />
              <p className="text-sm">Starting camera…</p>
            </div>
          )}
          
          {/* Error/Denied state */}
          {(cameraStatus === "error" || cameraStatus === "denied") && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
              <AlertCircle className="h-12 w-12 mb-2 opacity-50" />
              <p className="text-sm text-center px-4">
                {cameraStatus === "denied" ? "Permission denied" : "Camera unavailable"}
              </p>
            </div>
          )}
          
        {/* Status badges overlay when active */}
          {isActive && isVideoReady && (
            <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
              {faceDetectionStatus === "found" && getFocusBadge()}
              {faceDetectionBadge}
            </div>
          )}
          
          {/* State notification overlay */}
          {isActive && isVideoReady && modelStatus === "ready" && faceDetectionStatus === "found" && (
            <div className={`absolute bottom-2 left-2 right-2 p-2 rounded-lg text-center text-sm font-medium transition-all ${
              currentFocus === "stressed" 
                ? "bg-red-500/90 text-white" 
                : currentFocus === "focused" 
                  ? "bg-green-500/90 text-white" 
                  : "bg-amber-500/90 text-white"
            }`}>
              {currentFocus === "stressed" && "😟 Stressed - Take a break"}
              {currentFocus === "focused" && "🎯 Focused - Great job!"}
              {currentFocus === "neutral" && "😐 Relaxed - Stay engaged"}
            </div>
          )}
          
          {/* Video loading indicator */}
          {isActive && !isVideoReady && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/80">
              <Loader2 className="h-8 w-8 mb-2 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading camera...</p>
            </div>
          )}
          
          {/* Model loading overlay */}
          {isActive && isVideoReady && modelStatus === "loading" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/80">
              <Brain className="h-8 w-8 mb-2 animate-pulse text-primary" />
              <p className="text-sm text-muted-foreground">Loading AI model...</p>
            </div>
          )}
        </div>

        {/* Current State - Only when active, monitoring, and face is found */}
        {isActive && isVideoReady && isMonitoring && modelStatus === "ready" && faceDetectionStatus === "found" && (
          <div className="flex items-center justify-center gap-3 p-4 bg-muted/30 rounded-lg">
            {getFocusIcon()}
            <div>
              <p className="font-medium">Current State: {currentFocus.charAt(0).toUpperCase() + currentFocus.slice(1)}</p>
              <p className="text-xs text-muted-foreground">AI-powered real-time analysis</p>
            </div>
          </div>
        )}

        {/* Wellness Suggestion - Only when active, monitoring, and face is found */}
        {isActive && isVideoReady && isMonitoring && modelStatus === "ready" && faceDetectionStatus === "found" && (
          <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-lg border border-primary/10">
            {suggestion.icon}
            <div>
              <p className="font-medium text-sm">{suggestion.title}</p>
              <p className="text-xs text-muted-foreground">{suggestion.message}</p>
            </div>
          </div>
        )}

        {/* Not monitoring hint */}
        {isActive && isVideoReady && !isMonitoring && modelStatus === "ready" && (
          <div className="text-center p-4 bg-muted/30 rounded-lg">
            <p className="text-sm text-muted-foreground">
              Start monitoring above to begin AI facial analysis
            </p>
          </div>
        )}

        {/* Privacy Note */}
        <p className="text-xs text-muted-foreground text-center">
          🔒 All AI analysis runs locally using TensorFlow.js. No data leaves your device.
        </p>
      </div>
    </Card>
  );
};

export default FacialAnalysis;
