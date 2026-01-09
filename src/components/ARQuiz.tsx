import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, Trophy, RotateCcw, ArrowRight } from "lucide-react";
import { toast } from "sonner";

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface ARQuizProps {
  topic: string;
  onComplete: (score: number, total: number) => void;
  onClose: () => void;
}

const quizData: Record<string, QuizQuestion[]> = {
  dna: [
    {
      question: "What is the shape of a DNA molecule?",
      options: ["Single helix", "Double helix", "Triple helix", "Linear chain"],
      correctAnswer: 1,
      explanation: "DNA has a double helix structure, discovered by Watson and Crick in 1953."
    },
    {
      question: "Which base pairs with Adenine (A) in DNA?",
      options: ["Guanine", "Cytosine", "Thymine", "Uracil"],
      correctAnswer: 2,
      explanation: "Adenine pairs with Thymine (A-T), while Guanine pairs with Cytosine (G-C)."
    },
    {
      question: "What sugar is found in the backbone of DNA?",
      options: ["Glucose", "Fructose", "Ribose", "Deoxyribose"],
      correctAnswer: 3,
      explanation: "DNA contains deoxyribose sugar, hence the name 'deoxyribonucleic acid'."
    },
    {
      question: "How many hydrogen bonds form between G and C?",
      options: ["1", "2", "3", "4"],
      correctAnswer: 2,
      explanation: "G-C pairs form 3 hydrogen bonds, while A-T pairs form only 2."
    }
  ],
  atom: [
    {
      question: "What particle orbits the nucleus of an atom?",
      options: ["Proton", "Neutron", "Electron", "Quark"],
      correctAnswer: 2,
      explanation: "Electrons are negatively charged particles that orbit the atomic nucleus."
    },
    {
      question: "What is the charge of a proton?",
      options: ["Negative", "Positive", "Neutral", "Variable"],
      correctAnswer: 1,
      explanation: "Protons have a positive charge (+1), while electrons have a negative charge (-1)."
    },
    {
      question: "Where are protons located in an atom?",
      options: ["Electron cloud", "Nucleus", "Orbital shells", "Outside the atom"],
      correctAnswer: 1,
      explanation: "Protons and neutrons are found in the nucleus at the center of the atom."
    },
    {
      question: "What determines an element's atomic number?",
      options: ["Number of neutrons", "Number of protons", "Number of electrons", "Total mass"],
      correctAnswer: 1,
      explanation: "The atomic number equals the number of protons in an atom's nucleus."
    }
  ],
  cell: [
    {
      question: "What is the control center of a cell?",
      options: ["Mitochondria", "Ribosome", "Nucleus", "Cell membrane"],
      correctAnswer: 2,
      explanation: "The nucleus contains DNA and controls all cell activities."
    },
    {
      question: "Which organelle is called the 'powerhouse' of the cell?",
      options: ["Nucleus", "Mitochondria", "Chloroplast", "Golgi apparatus"],
      correctAnswer: 1,
      explanation: "Mitochondria produce ATP through cellular respiration, providing energy for the cell."
    },
    {
      question: "What structure surrounds and protects the cell?",
      options: ["Nucleus", "Cytoplasm", "Cell membrane", "Endoplasmic reticulum"],
      correctAnswer: 2,
      explanation: "The cell membrane is a semi-permeable barrier that controls what enters and exits the cell."
    },
    {
      question: "What is the jelly-like substance inside a cell called?",
      options: ["Cytoplasm", "Nucleoplasm", "Plasma", "Protoplasm"],
      correctAnswer: 0,
      explanation: "Cytoplasm is the gel-like fluid that fills the cell and suspends organelles."
    }
  ],
  math: [
    {
      question: "What is the equation z = x² - y² called?",
      options: ["Parabola", "Hyperbolic paraboloid", "Ellipse", "Sphere"],
      correctAnswer: 1,
      explanation: "z = x² - y² creates a saddle-shaped surface called a hyperbolic paraboloid."
    },
    {
      question: "In 3D graphing, what does the z-axis typically represent?",
      options: ["Width", "Height/Depth", "Length", "Time"],
      correctAnswer: 1,
      explanation: "In standard 3D coordinates, z usually represents the vertical (height) dimension."
    },
    {
      question: "What is the origin in a 3D coordinate system?",
      options: ["(1,1,1)", "(0,0,0)", "(0,1,0)", "Undefined"],
      correctAnswer: 1,
      explanation: "The origin is the point where all three axes intersect: (0,0,0)."
    },
    {
      question: "A surface where z depends on both x and y is called?",
      options: ["A line", "A plane", "A function of two variables", "A vector"],
      correctAnswer: 2,
      explanation: "When z = f(x,y), it's a function of two variables that creates a 3D surface."
    }
  ],
  stack: [
    {
      question: "What does LIFO stand for in stack operations?",
      options: ["Last In First Out", "Last In Fast Out", "Linear In First Out", "List In First Out"],
      correctAnswer: 0,
      explanation: "LIFO (Last In, First Out) means the last element added is the first one removed."
    },
    {
      question: "Which operation adds an element to the top of a stack?",
      options: ["Pop", "Push", "Enqueue", "Insert"],
      correctAnswer: 1,
      explanation: "Push adds an element to the top of the stack."
    },
    {
      question: "What happens when you pop from an empty stack?",
      options: ["Returns null", "Stack underflow", "Returns 0", "Nothing"],
      correctAnswer: 1,
      explanation: "Attempting to pop from an empty stack causes a stack underflow error."
    },
    {
      question: "Which data structure uses a stack internally?",
      options: ["BFS algorithm", "Function call management", "Round-robin scheduling", "Print queue"],
      correctAnswer: 1,
      explanation: "Function calls use a call stack to manage execution context and return addresses."
    }
  ],
  queue: [
    {
      question: "What does FIFO stand for in queue operations?",
      options: ["First In Fast Out", "Fast In First Out", "First In First Out", "Final In First Out"],
      correctAnswer: 2,
      explanation: "FIFO (First In, First Out) means the first element added is the first one removed."
    },
    {
      question: "Which operation removes an element from the front of a queue?",
      options: ["Push", "Pop", "Dequeue", "Enqueue"],
      correctAnswer: 2,
      explanation: "Dequeue removes and returns the element at the front of the queue."
    },
    {
      question: "Where are new elements added in a queue?",
      options: ["Front", "Middle", "Rear/Back", "Random position"],
      correctAnswer: 2,
      explanation: "New elements are always added at the rear (back) of the queue."
    },
    {
      question: "Which real-world scenario best represents a queue?",
      options: ["Undo operation in editor", "People waiting in line", "Recursive function calls", "Browser back button"],
      correctAnswer: 1,
      explanation: "People waiting in line follow FIFO: first person in line is served first."
    }
  ],
  array: [
    {
      question: "What is the time complexity to access an element by index in an array?",
      options: ["O(n)", "O(log n)", "O(1)", "O(n²)"],
      correctAnswer: 2,
      explanation: "Arrays provide O(1) constant time access because elements are stored contiguously in memory."
    },
    {
      question: "What is the index of the first element in most programming languages?",
      options: ["1", "0", "-1", "Depends on the language"],
      correctAnswer: 1,
      explanation: "In most languages (C, Java, Python, JavaScript), array indexing starts at 0."
    },
    {
      question: "What is a key limitation of static arrays?",
      options: ["Cannot store numbers", "Fixed size after creation", "Cannot be sorted", "Slow access time"],
      correctAnswer: 1,
      explanation: "Static arrays have a fixed size that cannot be changed after creation."
    },
    {
      question: "How are array elements stored in memory?",
      options: ["Randomly scattered", "Linked by pointers", "Contiguously/sequentially", "In a tree structure"],
      correctAnswer: 2,
      explanation: "Array elements are stored in contiguous (adjacent) memory locations."
    }
  ]
};

const ARQuiz = ({ topic, onComplete, onClose }: ARQuizProps) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);

  const questions = quizData[topic] || quizData.dna;
  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  const handleAnswer = (index: number) => {
    if (isAnswered) return;
    
    setSelectedAnswer(index);
    setIsAnswered(true);
    
    if (index === question.correctAnswer) {
      setScore((prev) => prev + 1);
      toast.success("Correct! 🎉");
    } else {
      toast.error("Not quite right");
    }
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    } else {
      setShowResults(true);
      onComplete(score + (selectedAnswer === question.correctAnswer ? 1 : 0), questions.length);
    }
  };

  const handleRetry = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setScore(0);
    setShowResults(false);
  };

  if (showResults) {
    const finalScore = score;
    const percentage = Math.round((finalScore / questions.length) * 100);
    
    return (
      <Card className="p-6 max-w-md mx-auto">
        <div className="text-center space-y-4">
          <div className="inline-flex p-4 rounded-full bg-primary/10">
            <Trophy className={`h-12 w-12 ${percentage >= 75 ? "text-yellow-500" : "text-primary"}`} />
          </div>
          <h2 className="text-2xl font-bold">Quiz Complete!</h2>
          <p className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 via-violet-500 to-fuchsia-500">
            {finalScore}/{questions.length}
          </p>
          <p className="text-muted-foreground">
            {percentage >= 75 
              ? "Excellent work! You've mastered this topic! 🌟" 
              : percentage >= 50 
                ? "Good effort! Keep practicing to improve. 💪" 
                : "Keep learning! Try the AR model again before retrying. 📚"}
          </p>
          <div className="flex gap-2 justify-center pt-4">
            <Button variant="outline" onClick={handleRetry}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Retry Quiz
            </Button>
            <Button className="gradient-primary text-primary-foreground" onClick={onClose}>
              Continue Learning
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 max-w-lg mx-auto">
      <div className="space-y-6">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Question {currentQuestion + 1} of {questions.length}</span>
            <span className="font-medium">Score: {score}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question */}
        <div>
          <h3 className="text-lg font-semibold mb-4">{question.question}</h3>
          <div className="space-y-2">
            {question.options.map((option, index) => {
              let buttonClass = "w-full justify-start text-left h-auto py-3 px-4";
              
              if (isAnswered) {
                if (index === question.correctAnswer) {
                  buttonClass += " border-success bg-success/10 text-success";
                } else if (index === selectedAnswer) {
                  buttonClass += " border-destructive bg-destructive/10 text-destructive";
                }
              } else if (selectedAnswer === index) {
                buttonClass += " border-primary bg-primary/10";
              }

              return (
                <Button
                  key={index}
                  variant="outline"
                  className={buttonClass}
                  onClick={() => handleAnswer(index)}
                  disabled={isAnswered}
                >
                  <span className="flex items-center gap-3">
                    {isAnswered && index === question.correctAnswer && (
                      <CheckCircle className="h-5 w-5 text-success shrink-0" />
                    )}
                    {isAnswered && index === selectedAnswer && index !== question.correctAnswer && (
                      <XCircle className="h-5 w-5 text-destructive shrink-0" />
                    )}
                    {!isAnswered && (
                      <span className="h-5 w-5 rounded-full border-2 shrink-0 flex items-center justify-center text-xs">
                        {String.fromCharCode(65 + index)}
                      </span>
                    )}
                    {option}
                  </span>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Explanation */}
        {isAnswered && (
          <div className="p-4 rounded-lg bg-muted">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Explanation:</strong> {question.explanation}
            </p>
          </div>
        )}

        {/* Next Button */}
        {isAnswered && (
          <Button className="w-full gradient-primary text-primary-foreground" onClick={handleNext}>
            {currentQuestion < questions.length - 1 ? (
              <>
                Next Question
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            ) : (
              "See Results"
            )}
          </Button>
        )}
      </div>
    </Card>
  );
};

export default ARQuiz;
