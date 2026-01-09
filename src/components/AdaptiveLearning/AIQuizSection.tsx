import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Brain, Loader2, CheckCircle, XCircle, ArrowRight, RefreshCw, Sparkles, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Question {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface AIQuizSectionProps {
  onQuizComplete?: (score: number, topic: string) => void;
}

const TOPICS = [
  { value: "arrays", label: "Arrays", description: "Index-based storage, traversal, operations" },
  { value: "stacks", label: "Stacks", description: "LIFO operations, push/pop, applications" },
  { value: "queues", label: "Queues", description: "FIFO operations, enqueue/dequeue, types" }
];

const DIFFICULTY_LEVELS = [
  { value: "beginner", label: "Beginner", questions: 3 },
  { value: "intermediate", label: "Intermediate", questions: 5 },
  { value: "advanced", label: "Advanced", questions: 7 }
];

const AIQuizSection = ({ onQuizComplete }: AIQuizSectionProps) => {
  const [subject, setSubject] = useState("Data Structures");
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [difficulty, setDifficulty] = useState("intermediate");
  const [isGenerating, setIsGenerating] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);

  const generateQuiz = async () => {
    if (!selectedTopic) {
      toast.error("Please select a topic");
      return;
    }

    setIsGenerating(true);
    setQuestions([]);
    setCurrentQuestion(0);
    setScore(0);
    setShowResults(false);

    const numQuestions = DIFFICULTY_LEVELS.find(d => d.value === difficulty)?.questions || 5;
    const topicLabel = TOPICS.find(t => t.value === selectedTopic)?.label || selectedTopic;

    try {
      const { data, error } = await supabase.functions.invoke("generate-quiz", {
        body: {
          concept: topicLabel,
          moduleName: subject,
          numQuestions
        }
      });

      if (error) throw error;

      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions);
        toast.success(`Generated ${data.questions.length} questions!`);
      } else {
        throw new Error("No questions generated");
      }
    } catch (error) {
      console.error("Error generating quiz:", error);
      // Use fallback questions
      setQuestions(getFallbackQuestions(selectedTopic));
      toast.info("Using practice questions");
    } finally {
      setIsGenerating(false);
    }
  };

  const getFallbackQuestions = (topic: string): Question[] => {
    const questionBank: Record<string, Question[]> = {
      arrays: [
        {
          question: "What is the time complexity of accessing an element by index in an array?",
          options: ["O(1)", "O(n)", "O(log n)", "O(n²)"],
          correctIndex: 0,
          explanation: "Arrays provide constant time O(1) access because elements are stored in contiguous memory locations."
        },
        {
          question: "What happens when you try to insert an element in the middle of an array?",
          options: ["O(1) operation", "Elements need to be shifted", "Array is recreated", "Not possible"],
          correctIndex: 1,
          explanation: "Inserting in the middle requires shifting all subsequent elements, making it O(n)."
        },
        {
          question: "Which of these is NOT a characteristic of arrays?",
          options: ["Fixed size", "Contiguous memory", "O(1) access", "Dynamic resizing"],
          correctIndex: 3,
          explanation: "Traditional arrays have fixed size. Dynamic arrays (like ArrayList) handle resizing separately."
        }
      ],
      stacks: [
        {
          question: "What principle does a Stack follow?",
          options: ["FIFO", "LIFO", "Random Access", "Priority Order"],
          correctIndex: 1,
          explanation: "Stack follows LIFO - Last In, First Out. The last element added is the first to be removed."
        },
        {
          question: "Which operation adds an element to a stack?",
          options: ["Enqueue", "Insert", "Push", "Add"],
          correctIndex: 2,
          explanation: "Push adds an element to the top of the stack."
        },
        {
          question: "What is a common use case for stacks?",
          options: ["Print queue", "Function call management", "BFS traversal", "Round-robin scheduling"],
          correctIndex: 1,
          explanation: "Function calls use a call stack to manage execution context and return addresses."
        }
      ],
      queues: [
        {
          question: "What principle does a Queue follow?",
          options: ["LIFO", "FIFO", "Random Access", "Priority Order"],
          correctIndex: 1,
          explanation: "Queue follows FIFO - First In, First Out. The first element added is the first to be removed."
        },
        {
          question: "Which operation removes an element from a queue?",
          options: ["Pop", "Dequeue", "Remove", "Delete"],
          correctIndex: 1,
          explanation: "Dequeue removes and returns the front element of the queue."
        },
        {
          question: "Which algorithm commonly uses a queue?",
          options: ["DFS", "BFS", "Quick Sort", "Binary Search"],
          correctIndex: 1,
          explanation: "Breadth-First Search (BFS) uses a queue to track nodes to visit level by level."
        }
      ]
    };

    return questionBank[topic] || questionBank.arrays;
  };

  const handleAnswerSelect = (index: number) => {
    if (isAnswered) return;
    
    setSelectedAnswer(index);
    setIsAnswered(true);
    
    if (index === questions[currentQuestion].correctIndex) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    } else {
      setShowResults(true);
      const finalScore = Math.round((score / questions.length) * 100);
      onQuizComplete?.(finalScore, selectedTopic);
    }
  };

  const resetQuiz = () => {
    setQuestions([]);
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setScore(0);
    setShowResults(false);
    setSelectedTopic("");
  };

  // Topic Selection View
  if (questions.length === 0 && !isGenerating) {
    return (
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            AI-Generated Quiz
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Subject</label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g., Data Structures"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Difficulty</label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIFFICULTY_LEVELS.map(level => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label} ({level.questions} questions)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Select Topic</label>
            <div className="grid gap-3 md:grid-cols-3">
              {TOPICS.map(topic => (
                <Card
                  key={topic.value}
                  className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                    selectedTopic === topic.value
                      ? "border-primary bg-primary/5"
                      : "hover:border-primary/30"
                  }`}
                  onClick={() => setSelectedTopic(topic.value)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      selectedTopic === topic.value ? "bg-primary/10" : "bg-muted"
                    }`}>
                      <BookOpen className={`h-4 w-4 ${
                        selectedTopic === topic.value ? "text-primary" : "text-muted-foreground"
                      }`} />
                    </div>
                    <div>
                      <p className="font-medium">{topic.label}</p>
                      <p className="text-xs text-muted-foreground">{topic.description}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <Button
            onClick={generateQuiz}
            disabled={!selectedTopic}
            className="w-full gap-2"
          >
            <Sparkles className="h-4 w-4" />
            Generate AI Quiz
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Loading State
  if (isGenerating) {
    return (
      <Card className="border-2">
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <div className="text-center">
              <p className="font-semibold">Generating AI Quiz...</p>
              <p className="text-sm text-muted-foreground">Creating personalized questions for you</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Results View
  if (showResults) {
    const percentage = Math.round((score / questions.length) * 100);
    const passed = percentage >= 70;

    return (
      <Card className="border-2">
        <CardContent className="py-8">
          <div className="text-center space-y-6">
            <div className={`inline-flex p-6 rounded-full ${passed ? "bg-success/10" : "bg-amber-500/10"}`}>
              {passed ? (
                <CheckCircle className="h-16 w-16 text-success" />
              ) : (
                <RefreshCw className="h-16 w-16 text-amber-500" />
              )}
            </div>

            <div>
              <h3 className="text-2xl font-bold mb-2">
                {passed ? "Excellent Work!" : "Keep Practicing!"}
              </h3>
              <p className="text-muted-foreground">
                You scored {score} out of {questions.length} questions
              </p>
            </div>

            <div className="max-w-xs mx-auto">
              <div className="flex justify-between text-sm mb-2">
                <span>Score</span>
                <span className="font-bold">{percentage}%</span>
              </div>
              <Progress value={percentage} className="h-3" />
            </div>

            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {passed
                ? "Great job! You've demonstrated solid understanding of this topic."
                : "Review the concepts and try again. Practice makes perfect!"}
            </p>

            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={resetQuiz}>
                Try Different Topic
              </Button>
              <Button onClick={generateQuiz}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retake Quiz
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Quiz View
  const currentQ = questions[currentQuestion];

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="outline">
              Question {currentQuestion + 1}/{questions.length}
            </Badge>
            <Badge className="bg-success/10 text-success border-success/20">
              Score: {score}
            </Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={resetQuiz}>
            Exit Quiz
          </Button>
        </div>
        <Progress value={((currentQuestion + 1) / questions.length) * 100} className="h-2 mt-3" />
      </CardHeader>
      <CardContent className="space-y-6">
        <h3 className="text-lg font-semibold">{currentQ.question}</h3>

        <div className="space-y-3">
          {currentQ.options.map((option, index) => {
            const isCorrect = index === currentQ.correctIndex;
            const isSelected = selectedAnswer === index;

            let optionClass = "border-border hover:border-primary/50";
            if (isAnswered) {
              if (isCorrect) {
                optionClass = "border-success bg-success/10";
              } else if (isSelected) {
                optionClass = "border-destructive bg-destructive/10";
              }
            } else if (isSelected) {
              optionClass = "border-primary bg-primary/5";
            }

            return (
              <Button
                key={index}
                variant="outline"
                className={`w-full justify-start text-left h-auto py-4 px-4 ${optionClass}`}
                onClick={() => handleAnswerSelect(index)}
                disabled={isAnswered}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium ${
                    isAnswered && isCorrect
                      ? "bg-success text-success-foreground"
                      : isAnswered && isSelected
                      ? "bg-destructive text-destructive-foreground"
                      : "bg-muted"
                  }`}>
                    {isAnswered && isCorrect ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : isAnswered && isSelected ? (
                      <XCircle className="h-4 w-4" />
                    ) : (
                      String.fromCharCode(65 + index)
                    )}
                  </div>
                  <span className="text-foreground">{option}</span>
                </div>
              </Button>
            );
          })}
        </div>

        {isAnswered && (
          <Card className="p-4 bg-muted/50 border-0">
            <p className="text-sm">
              <span className="font-medium">Explanation: </span>
              {currentQ.explanation}
            </p>
          </Card>
        )}

        {isAnswered && (
          <Button onClick={handleNext} className="w-full gap-2">
            {currentQuestion < questions.length - 1 ? (
              <>
                Next Question
                <ArrowRight className="h-4 w-4" />
              </>
            ) : (
              "See Results"
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default AIQuizSection;
