import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface ConceptPulseProps {
  quizScore?: number;
  timeSpent?: number;
  attempts?: number;
  className?: string;
}

const ConceptPulse = ({ quizScore = 0, timeSpent = 0, attempts = 0, className }: ConceptPulseProps) => {
  // Calculate understanding level based on multiple factors
  const calculatePulseLevel = (): "green" | "yellow" | "red" | "neutral" => {
    // If no attempts, neutral
    if (attempts === 0 && quizScore === 0) return "neutral";
    
    // Calculate score factor (0-1)
    const scoreFactor = quizScore / 100;
    
    // Calculate attempts factor (more attempts = lower score)
    // First attempt = 1.0, 2nd = 0.8, 3rd = 0.6, etc.
    const attemptsFactor = attempts > 0 ? Math.max(0.2, 1 - (attempts - 1) * 0.2) : 1;
    
    // Calculate time factor (reasonable time = 1.0, too quick or too long = lower)
    // Ideal time: 5-15 minutes per concept
    const timeMinutes = timeSpent / 60;
    let timeFactor = 1.0;
    if (timeMinutes < 2) {
      timeFactor = 0.5; // Too quick, might not have absorbed
    } else if (timeMinutes > 30) {
      timeFactor = 0.7; // Taking too long, might be struggling
    }
    
    // Combined score weighted: quiz (60%), attempts (25%), time (15%)
    const combinedScore = (scoreFactor * 0.6) + (attemptsFactor * 0.25) + (timeFactor * 0.15);
    
    if (combinedScore >= 0.7) return "green";
    if (combinedScore >= 0.4) return "yellow";
    return "red";
  };

  const pulseLevel = calculatePulseLevel();

  const pulseConfig = {
    green: {
      color: "bg-emerald-500",
      glow: "shadow-emerald-500/50",
      label: "Stable Understanding",
      description: "You have a solid grasp of this concept",
    },
    yellow: {
      color: "bg-amber-500",
      glow: "shadow-amber-500/50",
      label: "Shaky Understanding",
      description: "Some aspects may need reinforcement",
    },
    red: {
      color: "bg-rose-500",
      glow: "shadow-rose-500/50",
      label: "Fragile Understanding",
      description: "Consider reviewing this concept again",
    },
    neutral: {
      color: "bg-muted-foreground/30",
      glow: "",
      label: "Not Started",
      description: "Begin learning to see your understanding pulse",
    },
  };

  const config = pulseConfig[pulseLevel];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "relative flex items-center justify-center",
              className
            )}
          >
            {/* Outer pulse ring */}
            {pulseLevel !== "neutral" && (
              <span
                className={cn(
                  "absolute w-4 h-4 rounded-full animate-ping opacity-40",
                  config.color
                )}
              />
            )}
            {/* Inner solid dot */}
            <span
              className={cn(
                "relative w-3 h-3 rounded-full shadow-md",
                config.color,
                pulseLevel !== "neutral" && config.glow
              )}
            />
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-[200px]">
          <p className="font-semibold text-sm">{config.label}</p>
          <p className="text-xs text-muted-foreground">{config.description}</p>
          {attempts > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {attempts} attempt{attempts !== 1 ? 's' : ''} • {quizScore}% score
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ConceptPulse;
