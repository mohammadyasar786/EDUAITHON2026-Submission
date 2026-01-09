import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, CheckCircle, XCircle, Loader2, AlertTriangle, Lightbulb } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { LearningProfile } from "@/pages/AdaptiveLearning";

interface AdaptivePracticeProps {
  conceptId: string;
  conceptTitle: string;
  learningProfile: LearningProfile;
  previousScore?: number;
  onComplete: (score: number) => void;
  onBack: () => void;
}

interface Question {
  question: string;
  options: string[];
  correctIndex: number;
  difficulty: "easy" | "medium" | "hard";
  explanation: string;
}

interface WhyStuckFeedback {
  misconception: string;
  explanation: string;
  suggestion: string;
}

const AdaptivePractice = ({
  conceptId,
  conceptTitle,
  learningProfile,
  previousScore,
  onComplete,
  onBack,
}: AdaptivePracticeProps) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showResults, setShowResults] = useState(false);
  const [currentDifficulty, setCurrentDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [whyStuckFeedback, setWhyStuckFeedback] = useState<WhyStuckFeedback | null>(null);
  const [loadingFeedback, setLoadingFeedback] = useState(false);

  useEffect(() => {
    generateQuestions();
  }, [conceptId]);

  const getDifficultyFromScore = (score?: number): "easy" | "medium" | "hard" => {
    if (!score) return "medium";
    if (score < 40) return "easy";
    if (score > 70) return "hard";
    return "medium";
  };

  const generateQuestions = async () => {
    setIsLoading(true);
    const startDifficulty = getDifficultyFromScore(previousScore);
    setCurrentDifficulty(startDifficulty);

    try {
      const { data, error } = await supabase.functions.invoke("adaptive-learning", {
        body: {
          type: "practice",
          conceptId,
          conceptTitle,
          difficulty: startDifficulty,
          numQuestions: 5,
        },
      });

      if (error) throw error;
      setQuestions(data.questions);
    } catch (error) {
      console.error("Error generating questions:", error);
      setQuestions(getFallbackQuestions());
      toast.error("Using offline questions");
    } finally {
      setIsLoading(false);
    }
  };

  const getFallbackQuestions = (): Question[] => [
    {
      question: `What is a key characteristic of ${conceptTitle}?`,
      options: [
        "It stores data randomly",
        "It organizes data efficiently",
        "It only works with numbers",
        "It requires no memory",
      ],
      correctIndex: 1,
      difficulty: "easy",
      explanation: "Data structures are designed to organize and store data efficiently for specific use cases.",
    },
    {
      question: `Why is understanding ${conceptTitle} important in programming?`,
      options: [
        "It's not really important",
        "It helps write faster code",
        "It only matters for games",
        "It helps choose the right tool for the problem",
      ],
      correctIndex: 3,
      difficulty: "medium",
      explanation: "Understanding data structures helps programmers choose the most appropriate structure for their specific problem.",
    },
    {
      question: `What is the time complexity consideration for ${conceptTitle}?`,
      options: [
        "Time complexity doesn't matter",
        "All operations are always O(1)",
        "Different operations have different complexities",
        "It's always O(n²)",
      ],
      correctIndex: 2,
      difficulty: "hard",
      explanation: "Different data structure operations (insert, delete, search) typically have different time complexities.",
    },
  ];

  const handleAnswerSelect = async (index: number) => {
    if (isAnswered) return;
    setSelectedAnswer(index);
    setIsAnswered(true);

    const isCorrect = index === questions[currentIndex].correctIndex;
    if (isCorrect) {
      setScore((prev) => prev + 1);
      // Increase difficulty for next question
      if (currentDifficulty === "easy") setCurrentDifficulty("medium");
      else if (currentDifficulty === "medium") setCurrentDifficulty("hard");
    } else {
      // Decrease difficulty and get feedback
      if (currentDifficulty === "hard") setCurrentDifficulty("medium");
      else if (currentDifficulty === "medium") setCurrentDifficulty("easy");
      
      // Get "Why You're Stuck" feedback
      await getWhyStuckFeedback(index);
    }
  };

  const getWhyStuckFeedback = async (selectedIndex: number) => {
    setLoadingFeedback(true);
    try {
      const { data, error } = await supabase.functions.invoke("adaptive-learning", {
        body: {
          type: "why-stuck",
          question: questions[currentIndex].question,
          selectedAnswer: questions[currentIndex].options[selectedIndex],
          correctAnswer: questions[currentIndex].options[questions[currentIndex].correctIndex],
          conceptTitle,
        },
      });

      if (error) throw error;
      setWhyStuckFeedback(data);
    } catch (error) {
      console.error("Error getting feedback:", error);
      setWhyStuckFeedback({
        misconception: "Common confusion between similar concepts",
        explanation: questions[currentIndex].explanation,
        suggestion: "Review the concept explanation and try again with the practice questions.",
      });
    } finally {
      setLoadingFeedback(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
      setWhyStuckFeedback(null);
    } else {
      const finalScore = Math.round((score / questions.length) * 100);
      setShowResults(true);
    }
  };

  if (isLoading) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Generating adaptive practice questions...</p>
        </CardContent>
      </Card>
    );
  }

  if (showResults) {
    const finalScore = Math.round((score / questions.length) * 100);
    const passed = finalScore >= 70;

    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="py-12 text-center">
          <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-6 ${
            passed ? "bg-success/10" : "bg-amber-500/10"
          }`}>
            {passed ? (
              <CheckCircle className="h-10 w-10 text-success" />
            ) : (
              <AlertTriangle className="h-10 w-10 text-amber-500" />
            )}
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            {passed ? "Concept Mastered!" : "Keep Practicing"}
          </h2>
          <p className="text-muted-foreground mb-4">
            You scored {score}/{questions.length} ({finalScore}%)
          </p>
          <div className="flex justify-center gap-4">
            <Button variant="outline" onClick={onBack}>
              Back to Concept
            </Button>
            <Button onClick={() => onComplete(finalScore)}>
              {passed ? "Continue Learning" : "Try Again Later"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Concept
        </Button>
        <div className="flex items-center gap-3">
          <Badge variant="outline">
            Question {currentIndex + 1}/{questions.length}
          </Badge>
          <Badge className={`${
            currentDifficulty === "easy" ? "bg-success/10 text-success" :
            currentDifficulty === "medium" ? "bg-amber-500/10 text-amber-500" :
            "bg-destructive/10 text-destructive"
          }`}>
            {currentDifficulty.charAt(0).toUpperCase() + currentDifficulty.slice(1)}
          </Badge>
        </div>
      </div>

      <Progress value={progress} className="h-2" />

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg">{currentQuestion.question}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {currentQuestion.options.map((option, idx) => {
            let optionClass = "border-border hover:border-primary/50 hover:bg-muted/30";
            if (isAnswered) {
              if (idx === currentQuestion.correctIndex) {
                optionClass = "border-success bg-success/5";
              } else if (idx === selectedAnswer) {
                optionClass = "border-destructive bg-destructive/5";
              }
            } else if (selectedAnswer === idx) {
              optionClass = "border-primary bg-primary/5";
            }

            return (
              <button
                key={idx}
                onClick={() => handleAnswerSelect(idx)}
                disabled={isAnswered}
                className={`w-full flex items-center gap-3 p-4 rounded-lg border transition-all text-left ${optionClass}`}
              >
                <span className="w-8 h-8 rounded-full border flex items-center justify-center text-sm font-medium shrink-0">
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="flex-1">{option}</span>
                {isAnswered && idx === currentQuestion.correctIndex && (
                  <CheckCircle className="h-5 w-5 text-success shrink-0" />
                )}
                {isAnswered && idx === selectedAnswer && idx !== currentQuestion.correctIndex && (
                  <XCircle className="h-5 w-5 text-destructive shrink-0" />
                )}
              </button>
            );
          })}
        </CardContent>
      </Card>

      {/* Why You're Stuck Feedback */}
      {isAnswered && selectedAnswer !== currentQuestion.correctIndex && (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <Lightbulb className="h-5 w-5" />
              Why You Might Be Stuck
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingFeedback ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing your answer...
              </div>
            ) : whyStuckFeedback ? (
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium text-foreground">Possible Misconception: </span>
                  <span className="text-muted-foreground">{whyStuckFeedback.misconception}</span>
                </div>
                <div>
                  <span className="font-medium text-foreground">Explanation: </span>
                  <span className="text-muted-foreground">{whyStuckFeedback.explanation}</span>
                </div>
                <div className="bg-background/50 p-3 rounded-lg">
                  <span className="font-medium text-foreground">Suggestion: </span>
                  <span className="text-muted-foreground">{whyStuckFeedback.suggestion}</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{currentQuestion.explanation}</p>
            )}
          </CardContent>
        </Card>
      )}

      {isAnswered && (
        <div className="flex justify-end">
          <Button onClick={handleNext}>
            {currentIndex < questions.length - 1 ? "Next Question" : "See Results"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default AdaptivePractice;
