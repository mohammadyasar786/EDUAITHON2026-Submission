import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, MessageSquare, CheckCircle, AlertCircle, Lightbulb } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ExplainItBackProps {
  conceptId: string;
  conceptTitle: string;
  onComplete: (hasGoodUnderstanding: boolean) => void;
  onSkip: () => void;
}

interface FeedbackData {
  clarity: "good" | "partial" | "needs-work";
  feedback: string;
  missingLinks: string[];
  suggestions: string[];
}

const ExplainItBack = ({ conceptId, conceptTitle, onComplete, onSkip }: ExplainItBackProps) => {
  const [explanation, setExplanation] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);

  const analyzeExplanation = async () => {
    if (!explanation.trim() || explanation.length < 20) return;
    
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("aiva-chat", {
        body: {
          message: `As an educational AI, analyze this student's explanation of "${conceptTitle}":

"${explanation}"

Provide constructive feedback focusing on:
1. Whether they understand the core concept
2. Any missing links or misconceptions
3. Gentle suggestions for improvement

Format your response as:
- Start with encouragement
- Identify what they got right
- Gently point out any gaps
- Offer a clarifying question or tip

Keep the tone supportive and academic. Do NOT grade or score.`,
          context: { concept: conceptTitle },
          learningStyle: "step-by-step",
        },
      });

      if (error) throw error;

      // Parse the AI response to extract feedback structure
      const aiResponse = data?.response || "";
      
      // Determine clarity level based on response content
      let clarity: "good" | "partial" | "needs-work" = "partial";
      const lowerResponse = aiResponse.toLowerCase();
      if (lowerResponse.includes("excellent") || lowerResponse.includes("great understanding") || lowerResponse.includes("well done")) {
        clarity = "good";
      } else if (lowerResponse.includes("misconception") || lowerResponse.includes("not quite") || lowerResponse.includes("missing")) {
        clarity = "needs-work";
      }

      setFeedback({
        clarity,
        feedback: aiResponse,
        missingLinks: [],
        suggestions: [],
      });
    } catch (error) {
      console.error("Error analyzing explanation:", error);
      setFeedback({
        clarity: "partial",
        feedback: "I couldn't fully analyze your explanation right now, but writing it out is a great way to reinforce your understanding. Keep practicing!",
        missingLinks: [],
        suggestions: [],
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getClarityIcon = (clarity: FeedbackData["clarity"]) => {
    switch (clarity) {
      case "good":
        return <CheckCircle className="h-5 w-5 text-emerald-500" />;
      case "partial":
        return <Lightbulb className="h-5 w-5 text-amber-500" />;
      case "needs-work":
        return <AlertCircle className="h-5 w-5 text-rose-500" />;
    }
  };

  const getClarityLabel = (clarity: FeedbackData["clarity"]) => {
    switch (clarity) {
      case "good":
        return "Strong Understanding";
      case "partial":
        return "Good Foundation";
      case "needs-work":
        return "Let's Build on This";
    }
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
            <MessageSquare className="h-5 w-5 text-info" />
          </div>
          <div>
            <CardTitle className="text-lg">Explain It Back</CardTitle>
            <CardDescription>
              Explain "{conceptTitle}" in your own words to reinforce understanding
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!feedback ? (
          <>
            <Textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Write your explanation here. Don't worry about being perfect — this is for your own learning..."
              className="min-h-[150px] resize-none"
              disabled={isAnalyzing}
            />
            <p className="text-xs text-muted-foreground">
              Tip: Try to explain as if you're teaching a friend. This helps identify gaps in understanding.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={analyzeExplanation}
                disabled={explanation.length < 20 || isAnalyzing}
                className="flex-1"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  "Get Feedback"
                )}
              </Button>
              <Button variant="ghost" onClick={onSkip}>
                Skip for now
              </Button>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            {/* Clarity indicator */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              {getClarityIcon(feedback.clarity)}
              <span className="font-medium text-foreground">
                {getClarityLabel(feedback.clarity)}
              </span>
            </div>

            {/* Feedback text */}
            <div className="prose prose-sm dark:prose-invert max-w-none">
              {feedback.feedback.split("\n").map((paragraph, idx) => (
                <p key={idx} className="text-foreground text-sm leading-relaxed mb-2">
                  {paragraph}
                </p>
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                onClick={() => onComplete(feedback.clarity === "good")}
                className="flex-1"
              >
                Continue Learning
              </Button>
              <Button
                variant="outline"
                onClick={() => setFeedback(null)}
              >
                Try Again
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ExplainItBack;
