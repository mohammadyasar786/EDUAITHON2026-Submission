import { useState, useRef, Suspense, lazy } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, ChevronDown, ChevronUp, Video } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface VideoData {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
}

interface ConceptVideoSectionProps {
  topic: "array" | "stack" | "queue";
}

const videoContent: Record<string, VideoData[]> = {
  array: [
    {
      id: "array-indexing",
      title: "Array Indexing & Traversal",
      description: "Learn how elements are accessed by index and how to traverse through an array sequentially.",
      videoUrl: "/videos/array-indexing.mp4"
    },
    {
      id: "array-operations",
      title: "Insertion & Deletion Operations",
      description: "Understand how elements are inserted and deleted, and the impact on array indices.",
      videoUrl: "/videos/array-operations.mp4"
    }
  ],
  stack: [
    {
      id: "stack-push",
      title: "Push Operation",
      description: "See how elements are added to the top of the stack following LIFO principle.",
      videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4"
    },
    {
      id: "stack-pop",
      title: "Pop Operation",
      description: "Watch how the top element is removed from the stack.",
      videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4"
    },
    {
      id: "stack-overflow",
      title: "Overflow & Underflow",
      description: "Visualize what happens when a stack exceeds its capacity or when popping from empty.",
      videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4"
    }
  ],
  queue: [
    {
      id: "queue-enqueue",
      title: "Enqueue Operation",
      description: "See how elements are added to the rear of the queue.",
      videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4"
    },
    {
      id: "queue-dequeue",
      title: "Dequeue Operation",
      description: "Watch how elements are removed from the front of the queue following FIFO.",
      videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4"
    },
    {
      id: "queue-pointers",
      title: "Front & Rear Pointer Movement",
      description: "Understand how front and rear pointers track queue positions during operations.",
      videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4"
    }
  ]
};

const topicLabels: Record<string, string> = {
  array: "Arrays",
  stack: "Stacks",
  queue: "Queues"
};

const VideoPlayer = ({ video }: { video: VideoData }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleRestart = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleVideoLoaded = () => {
    setIsLoaded(true);
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
  };

  return (
    <Card className="overflow-hidden border hover:border-primary/30 transition-colors">
      <div className="p-4 border-b bg-muted/30">
        <h4 className="font-semibold text-sm">{video.title}</h4>
        <p className="text-xs text-muted-foreground mt-1">{video.description}</p>
      </div>
      
      <div className="relative aspect-video bg-black">
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <Skeleton className="w-full h-full" />
          </div>
        )}
        <video
          ref={videoRef}
          src={video.videoUrl}
          className="w-full h-full object-contain"
          onLoadedData={handleVideoLoaded}
          onEnded={handleVideoEnded}
          preload="metadata"
          playsInline
        />
        
        {/* Play overlay when not playing */}
        {!isPlaying && isLoaded && (
          <div 
            className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer"
            onClick={handlePlayPause}
          >
            <div className="p-4 rounded-full bg-primary/90 hover:bg-primary transition-colors">
              <Play className="h-8 w-8 text-primary-foreground" fill="currentColor" />
            </div>
          </div>
        )}
      </div>

      <div className="p-3 flex gap-2 bg-muted/20">
        <Button 
          variant="outline" 
          size="sm" 
          className="flex-1"
          onClick={handlePlayPause}
        >
          {isPlaying ? (
            <>
              <Pause className="h-4 w-4 mr-2" />
              Pause
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Play
            </>
          )}
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleRestart}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
};

const ConceptVideoSection = ({ topic }: ConceptVideoSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const videos = videoContent[topic] || [];

  if (videos.length === 0) return null;

  return (
    <Card className="border-2 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Video className="h-5 w-5 text-primary" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold">{topicLabels[topic]} - Video Tutorials</h3>
            <p className="text-sm text-muted-foreground">
              {videos.length} videos explaining key operations
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        )}
      </button>

      {isExpanded && (
        <div className="p-4 pt-0 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((video) => (
            <VideoPlayer key={video.id} video={video} />
          ))}
        </div>
      )}
    </Card>
  );
};

export default ConceptVideoSection;
