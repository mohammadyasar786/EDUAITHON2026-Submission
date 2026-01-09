import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Brain, Eye, Layers, ListOrdered, Calculator, ArrowRight, CheckCircle } from "lucide-react";
import type { LearningProfile } from "@/pages/AdaptiveLearning";
interface DiagnosticOnboardingProps {
  onComplete: (profile: LearningProfile) => void;
}
// Diagnostic questions focused on Arrays, Stacks, and Queues ONLY
const diagnosticQuestions = [{
  id: 1,
  question: "What is the time complexity of accessing an element in an array by its index?",
  options: [{
    value: "a",
    label: "O(n)"
  }, {
    value: "b",
    label: "O(1)",
    correct: true
  }, {
    value: "c",
    label: "O(log n)"
  }, {
    value: "d",
    label: "O(n²)"
  }]
}, {
  id: 2,
  question: "Which data structure uses the LIFO (Last In, First Out) principle?",
  options: [{
    value: "a",
    label: "Queue"
  }, {
    value: "b",
    label: "Stack",
    correct: true
  }, {
    value: "c",
    label: "Array"
  }, {
    value: "d",
    label: "Linked List"
  }]
}, {
  id: 3,
  question: "What operation adds an element to the rear of a queue?",
  options: [{
    value: "a",
    label: "Push"
  }, {
    value: "b",
    label: "Pop"
  }, {
    value: "c",
    label: "Enqueue",
    correct: true
  }, {
    value: "d",
    label: "Peek"
  }]
}, {
  id: 4,
  question: "Which is a common use case for stacks?",
  options: [{
    value: "a",
    label: "Print job scheduling"
  }, {
    value: "b",
    label: "Undo functionality in text editors",
    correct: true
  }, {
    value: "c",
    label: "First-come-first-served queuing"
  }, {
    value: "d",
    label: "Round-robin scheduling"
  }]
}, {
  id: 5,
  question: "What is the main disadvantage of arrays compared to dynamic data structures?",
  options: [{
    value: "a",
    label: "Slow access time"
  }, {
    value: "b",
    label: "Fixed size in most implementations",
    correct: true
  }, {
    value: "c",
    label: "Cannot store numbers"
  }, {
    value: "d",
    label: "Require pointers"
  }]
}];
const learningStyles = [{
  value: "visual" as const,
  label: "Visual Learner",
  description: "I understand best with diagrams, charts, and visual representations",
  icon: Eye
}, {
  value: "analogy" as const,
  label: "Analogy-Based",
  description: "I prefer real-world comparisons and relatable examples",
  icon: Layers
}, {
  value: "step-by-step" as const,
  label: "Step-by-Step",
  description: "I learn best with detailed, sequential instructions",
  icon: ListOrdered
}, {
  value: "formula-first" as const,
  label: "Formula-First",
  description: "I prefer mathematical formulas and formal definitions",
  icon: Calculator
}];
const DiagnosticOnboarding = ({
  onComplete
}: DiagnosticOnboardingProps) => {
  const [step, setStep] = useState<"intro" | "diagnostic" | "style" | "complete">("intro");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{
    questionId: number;
    answer: string;
    correct: boolean;
  }[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [selectedStyle, setSelectedStyle] = useState<LearningProfile["learningStyle"] | null>(null);
  const handleAnswerSubmit = () => {
    const question = diagnosticQuestions[currentQuestion];
    const correctOption = question.options.find(o => o.correct);
    const isCorrect = selectedAnswer === correctOption?.value;
    setAnswers([...answers, {
      questionId: question.id,
      answer: selectedAnswer,
      correct: isCorrect
    }]);
    setSelectedAnswer("");
    if (currentQuestion < diagnosticQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setStep("style");
    }
  };
  const handleStyleSelect = () => {
    if (!selectedStyle) return;
    const correctAnswers = answers.filter(a => a.correct).length;
    const diagnosticScore = correctAnswers / diagnosticQuestions.length * 100;
    const profile: LearningProfile = {
      diagnosticScore,
      learningStyle: selectedStyle,
      answeredQuestions: answers.map(a => ({
        questionId: a.questionId,
        correct: a.correct
      }))
    };
    setStep("complete");
    setTimeout(() => onComplete(profile), 1500);
  };
  const progress = step === "diagnostic" ? (currentQuestion + 1) / diagnosticQuestions.length * 100 : step === "style" ? 100 : 0;
  if (step === "intro") {
    return <Card className="max-w-2xl mx-auto border-border/50 bg-card/50 backdrop-blur-sm rounded-3xl">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Brain className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Arrays, Stacks, and Queues</CardTitle>
          <CardDescription className="text-base mt-2">
            Let's create your personalized learning profile for this chapter. This will help us tailor 
            explanations and practice questions to your unique learning style.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted/30 p-4 space-y-3 rounded-3xl">
            <h3 className="font-medium text-foreground">What to expect:</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                <span>5 quick diagnostic questions to assess your current knowledge</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                <span>Learning style selection to customize explanations</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                <span>Takes about 3-5 minutes to complete</span>
              </li>
            </ul>
          </div>
          <Button onClick={() => setStep("diagnostic")} size="lg" className="w-full rounded-full">
            Start Assessment
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>;
  }
  if (step === "diagnostic") {
    const question = diagnosticQuestions[currentQuestion];
    return <Card className="max-w-2xl mx-auto border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              Question {currentQuestion + 1} of {diagnosticQuestions.length}
            </span>
            <span className="text-sm font-medium text-primary">
              {Math.round(progress)}% Complete
            </span>
          </div>
          <Progress value={progress} className="h-2" />
          <CardTitle className="text-xl mt-4">{question.question}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer}>
            {question.options.map(option => <div key={option.value} className={`flex items-center space-x-3 p-4 rounded-lg border transition-colors cursor-pointer ${selectedAnswer === option.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30"}`} onClick={() => setSelectedAnswer(option.value)}>
                <RadioGroupItem value={option.value} id={option.value} />
                <Label htmlFor={option.value} className="flex-1 cursor-pointer">
                  {option.label}
                </Label>
              </div>)}
          </RadioGroup>
          <Button onClick={handleAnswerSubmit} disabled={!selectedAnswer} className="w-full" size="lg">
            {currentQuestion < diagnosticQuestions.length - 1 ? "Next Question" : "Continue"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>;
  }
  if (step === "style") {
    return <Card className="max-w-2xl mx-auto border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">How do you learn best?</CardTitle>
          <CardDescription>
            Select the learning style that resonates most with you
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            {learningStyles.map(style => {
            const Icon = style.icon;
            return <div key={style.value} className={`flex items-start gap-4 p-4 rounded-lg border transition-colors cursor-pointer ${selectedStyle === style.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30"}`} onClick={() => setSelectedStyle(style.value)}>
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">{style.label}</h4>
                    <p className="text-sm text-muted-foreground">{style.description}</p>
                  </div>
                </div>;
          })}
          </div>
          <Button onClick={handleStyleSelect} disabled={!selectedStyle} className="w-full mt-4" size="lg">
            Create My Learning Profile
            <CheckCircle className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>;
  }
  if (step === "complete") {
    const correctCount = answers.filter(a => a.correct).length;
    return <Card className="max-w-2xl mx-auto border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="py-12 text-center">
          <div className="mx-auto w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-6">
            <CheckCircle className="h-10 w-10 text-success" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Profile Created!</h2>
          <p className="text-muted-foreground mb-4">
            You scored {correctCount}/{diagnosticQuestions.length} on the diagnostic
          </p>
          <p className="text-sm text-muted-foreground">
            Preparing your personalized learning experience...
          </p>
        </CardContent>
      </Card>;
  }
  return null;
};
export default DiagnosticOnboarding;