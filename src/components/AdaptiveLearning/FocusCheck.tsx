import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Battery, BatteryLow, BatteryMedium, BatteryFull, X, Coffee } from "lucide-react";

interface FocusCheckProps {
  currentFocus: "low" | "medium" | "high";
  onFocusUpdate: (level: "low" | "medium" | "high") => void;
  onClose: () => void;
}

const focusLevels = [
  {
    value: "low" as const,
    label: "Low Focus",
    description: "Feeling distracted or tired",
    icon: BatteryLow,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30",
  },
  {
    value: "medium" as const,
    label: "Medium Focus",
    description: "Somewhat focused, could be better",
    icon: BatteryMedium,
    color: "text-info",
    bgColor: "bg-info/10 hover:bg-info/20 border-info/30",
  },
  {
    value: "high" as const,
    label: "High Focus",
    description: "Fully engaged and alert",
    icon: BatteryFull,
    color: "text-success",
    bgColor: "bg-success/10 hover:bg-success/20 border-success/30",
  },
];

const FocusCheck = ({ currentFocus, onFocusUpdate, onClose }: FocusCheckProps) => {
  const handleFocusSelect = (level: "low" | "medium" | "high") => {
    onFocusUpdate(level);
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-border/50 bg-card shadow-xl">
        <CardHeader className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Battery className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Focus Check</CardTitle>
              <CardDescription>How are you feeling right now?</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {focusLevels.map((level) => {
            const Icon = level.icon;
            const isSelected = currentFocus === level.value;
            
            return (
              <button
                key={level.value}
                onClick={() => handleFocusSelect(level.value)}
                className={`w-full flex items-center gap-4 p-4 rounded-lg border transition-all text-left ${
                  isSelected ? level.bgColor : "border-border hover:border-primary/50 hover:bg-muted/30"
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  isSelected ? level.bgColor : "bg-muted/50"
                }`}>
                  <Icon className={`h-5 w-5 ${isSelected ? level.color : "text-muted-foreground"}`} />
                </div>
                <div>
                  <h4 className="font-medium text-foreground">{level.label}</h4>
                  <p className="text-sm text-muted-foreground">{level.description}</p>
                </div>
              </button>
            );
          })}

          <div className="pt-4 border-t border-border">
            <div className="flex items-start gap-3 text-sm text-muted-foreground">
              <Coffee className="h-5 w-5 shrink-0 text-primary" />
              <p>
                If your focus is low, we'll simplify explanations and suggest taking 
                short breaks to help you learn more effectively.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FocusCheck;
