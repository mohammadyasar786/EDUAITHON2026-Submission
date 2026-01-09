import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, BookOpen, Loader2, Volume2, CheckCircle, XCircle, Lightbulb, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import AdaptivePractice from "./AdaptivePractice";
import NPTELSuggestion from "./NPTELSuggestion";
import InteractiveVisuals from "./InteractiveVisuals";
import FacultyResearchContent from "./FacultyResearchContent";
import type { LearningProfile, ConceptProgress } from "@/pages/AdaptiveLearning";

interface ConceptLearningProps {
  conceptId: string;
  learningProfile: LearningProfile;
  progress?: ConceptProgress;
  onBack: () => void;
  onProgressUpdate: (progress: Partial<ConceptProgress>) => void;
}

// Focused on Arrays, Stacks, and Queues chapter ONLY
const conceptData: Record<string, { title: string; content: string }> = {
  arrays: {
    title: "Arrays",
    content: "Arrays are fundamental data structures that store elements in contiguous memory locations. They provide O(1) access time for elements using indices. Arrays have fixed size in most languages, and elements can be accessed, modified, or iterated efficiently. Key operations include: Access (O(1)), Search (O(n)), Insert at end (O(1) amortized), Insert at position (O(n)), Delete (O(n)).",
  },
  stacks: {
    title: "Stacks",
    content: "Stacks follow the LIFO (Last In, First Out) principle. Think of a stack of plates - you can only add or remove from the top. Key operations: Push (add to top), Pop (remove from top), Peek (view top without removing). Common uses: Function call management, Undo operations, Expression evaluation, Backtracking algorithms, Browser history.",
  },
  queues: {
    title: "Queues",
    content: "Queues follow the FIFO (First In, First Out) principle. Like a line at a store - first person in line is served first. Key operations: Enqueue (add to rear), Dequeue (remove from front), Front (view first element). Common uses: Task scheduling, BFS traversal, Print job spooling, Message queues, CPU scheduling.",
  },
};

const ConceptLearning = ({
  conceptId,
  learningProfile,
  progress,
  onBack,
  onProgressUpdate,
}: ConceptLearningProps) => {
  const [explanation, setExplanation] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showPractice, setShowPractice] = useState(false);
  const [timeSpent, setTimeSpent] = useState(progress?.timeSpent || 0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { speak, isSpeaking, stop } = useTextToSpeech();

  const concept = conceptData[conceptId];

  useEffect(() => {
    generateExplanation();
    onProgressUpdate({ status: "in-progress" });

    // Start timer
    timerRef.current = setInterval(() => {
      setTimeSpent((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [conceptId]);

  useEffect(() => {
    // Save time spent periodically
    const saveInterval = setInterval(() => {
      onProgressUpdate({ timeSpent });
    }, 10000);

    return () => clearInterval(saveInterval);
  }, [timeSpent]);

  const generateExplanation = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("adaptive-learning", {
        body: {
          type: "explanation",
          conceptId,
          conceptTitle: concept?.title,
          conceptContent: concept?.content,
          learningStyle: learningProfile.learningStyle,
          diagnosticScore: learningProfile.diagnosticScore,
          timeSpent: progress?.timeSpent || 0,
          quizScore: progress?.quizScore || 0,
        },
      });

      if (error) throw error;
      setExplanation(data.explanation);
    } catch (error) {
      console.error("Error generating explanation:", error);
      // Fallback explanation
      setExplanation(getStaticExplanation());
      toast.error("Using offline explanation");
    } finally {
      setIsLoading(false);
    }
  };

  const getStaticExplanation = () => {
    const styleIntros: Record<string, string> = {
      visual: "📊 Let's visualize this concept:\n\n",
      analogy: "🎯 Think of it like this:\n\n",
      "step-by-step": "📋 Let's break this down step by step:\n\n",
      "formula-first": "📐 Here's the formal definition:\n\n",
    };

    return `${styleIntros[learningProfile.learningStyle]}${concept?.content}\n\n**Key Points:**\n- This concept is fundamental to understanding data structures\n- Practice with examples to reinforce your understanding\n- Connect this to real-world applications`;
  };

  const handlePracticeComplete = (score: number) => {
    onProgressUpdate({
      quizScore: score,
      status: score >= 70 ? "mastered" : "in-progress",
      attempts: (progress?.attempts || 0) + 1,
    });
    setShowPractice(false);
    if (score >= 70) {
      toast.success("Concept mastered! You can now move to the next topic.");
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (showPractice) {
    return (
      <AdaptivePractice
        conceptId={conceptId}
        conceptTitle={concept?.title || ""}
        learningProfile={learningProfile}
        previousScore={progress?.quizScore}
        onComplete={handlePracticeComplete}
        onBack={() => setShowPractice(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Chapter
        </Button>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="gap-1">
            <BookOpen className="h-3 w-3" />
            {formatTime(timeSpent)} spent
          </Badge>
          {progress?.status === "mastered" && (
            <Badge className="bg-success/10 text-success border-success/20">
              <CheckCircle className="h-3 w-3 mr-1" />
              Mastered
            </Badge>
          )}
        </div>
      </div>

      {/* Concept Explanation */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{concept?.title}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Adapted for your {learningProfile.learningStyle.replace("-", " ")} learning style
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => (isSpeaking ? stop() : speak(explanation))}
                disabled={isLoading}
              >
                <Volume2 className={`h-4 w-4 ${isSpeaking ? "text-primary" : ""}`} />
              </Button>
              <Button variant="outline" size="sm" onClick={generateExplanation} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Generating personalized explanation...</span>
            </div>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              {explanation.split("\n").map((paragraph, idx) => (
                <p key={idx} className="text-foreground leading-relaxed mb-4">
                  {paragraph}
                </p>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Interactive Visual Diagram */}
      <InteractiveVisuals conceptId={conceptId} />

      {/* Faculty and Research Expert Content */}
      <FacultyResearchContent conceptId={conceptId} />

      {/* Optional NPTEL Academic Video */}
      <NPTELSuggestion conceptId={conceptId} conceptTitle={concept?.title || ""} />

      {/* Practice Section */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Lightbulb className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Ready to Practice?</h3>
                <p className="text-sm text-muted-foreground">
                  {progress?.quizScore
                    ? `Previous score: ${progress.quizScore}% • ${progress.attempts || 0} attempts`
                    : "Test your understanding with adaptive practice questions"}
                </p>
              </div>
            </div>
            <Button onClick={() => setShowPractice(true)} className="gap-2">
              {progress?.quizScore ? "Practice Again" : "Start Practice"}
            </Button>
          </div>
          {progress?.quizScore !== undefined && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">Mastery Progress</span>
                <span className="font-medium">{progress.quizScore}%</span>
              </div>
              <Progress value={progress.quizScore} className="h-2" />
              {progress.quizScore < 70 && (
                <p className="text-xs text-muted-foreground mt-2">
                  Score 70% or higher to master this concept
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ConceptLearning;
