import { useState } from "react";
import { Bot, X, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import AIVAChat from "./AIVAChat";

interface AIVAButtonProps {
  context?: {
    chapter?: string;
    concept?: string;
    topic?: string;
    recentPerformance?: string;
    focusLevel?: string;
  };
  learningStyle?: string;
}

const AIVAButton = ({ context, learningStyle }: AIVAButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const handleToggle = () => {
    if (isMinimized) {
      setIsMinimized(false);
    } else {
      setIsOpen(!isOpen);
    }
  };

  const handleMinimize = () => {
    setIsMinimized(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  return (
    <>
      {/* AIVA Floating Button */}
      <Button
        onClick={handleToggle}
        className={cn(
          "fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg transition-all duration-300",
          "bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700",
          "flex items-center justify-center",
          isOpen && !isMinimized && "scale-0 opacity-0"
        )}
        size="icon"
        aria-label="Open AIVA - AI Learning Assistant"
      >
        <Bot className="h-6 w-6 text-white" />
        {/* Pulse animation when minimized */}
        {isMinimized && (
          <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-amber-400 animate-pulse" />
        )}
      </Button>

      {/* AIVA Chat Panel */}
      {isOpen && !isMinimized && (
        <div className="fixed bottom-6 right-6 z-50 w-[360px] max-w-[calc(100vw-48px)] animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-600">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">AIVA</h3>
                  <p className="text-xs text-white/80">AI Learning Companion</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/20"
                  onClick={handleMinimize}
                  aria-label="Minimize AIVA"
                >
                  <Minimize2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/20"
                  onClick={handleClose}
                  aria-label="Close AIVA"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Chat Content */}
            <AIVAChat context={context} learningStyle={learningStyle} />
          </div>
        </div>
      )}
    </>
  );
};

export default AIVAButton;
