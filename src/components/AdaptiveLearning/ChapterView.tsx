import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BookOpen, Lock, CheckCircle, PlayCircle, RotateCcw,
  Brain, ChevronRight, Clock, Target
} from "lucide-react";
import FocusCheck from "./FocusCheck";
import ConceptPulse from "./ConceptPulse";
import type { LearningProfile, ConceptProgress } from "@/pages/AdaptiveLearning";

interface ChapterViewProps {
  learningProfile: LearningProfile;
  conceptProgress: ConceptProgress[];
  onConceptSelect: (conceptId: string) => void;
  onResetProfile: () => void;
}

// Focused chapter: Arrays, Stacks, and Queues ONLY
const chapterData = {
  title: "Arrays, Stacks, and Queues",
  description: "Master fundamental linear data structures for efficient data management",
  concepts: [
    {
      id: "arrays",
      title: "Arrays",
      description: "Contiguous memory storage with O(1) access time using indices",
      prerequisites: [],
      estimatedTime: 20,
    },
    {
      id: "stacks",
      title: "Stacks",
      description: "LIFO (Last In, First Out) data structure for backtracking and recursion",
      prerequisites: ["arrays"],
      estimatedTime: 25,
    },
    {
      id: "queues",
      title: "Queues",
      description: "FIFO (First In, First Out) data structure for scheduling and BFS",
      prerequisites: ["arrays"],
      estimatedTime: 25,
    },
  ],
};

const ChapterView = ({ 
  learningProfile, 
  conceptProgress, 
  onConceptSelect, 
  onResetProfile 
}: ChapterViewProps) => {
  const [focusLevel, setFocusLevel] = useState<"low" | "medium" | "high">("medium");
  const [showFocusCheck, setShowFocusCheck] = useState(false);

  const getConceptStatus = (conceptId: string): ConceptProgress["status"] => {
    const progress = conceptProgress.find((p) => p.conceptId === conceptId);
    return progress?.status || "not-started";
  };

  const isConceptUnlocked = (concept: typeof chapterData.concepts[0]) => {
    if (concept.prerequisites.length === 0) return true;
    return concept.prerequisites.every((prereq) => {
      const progress = conceptProgress.find((p) => p.conceptId === prereq);
      return progress?.status === "mastered";
    });
  };

  const masteredCount = conceptProgress.filter((p) => p.status === "mastered").length;
  const totalConcepts = chapterData.concepts.length;
  const overallProgress = (masteredCount / totalConcepts) * 100;

  const getStatusBadge = (status: ConceptProgress["status"], isUnlocked: boolean) => {
    if (!isUnlocked) {
      return <Badge variant="secondary" className="bg-muted text-muted-foreground"><Lock className="h-3 w-3 mr-1" />Locked</Badge>;
    }
    switch (status) {
      case "mastered":
        return <Badge className="bg-success/10 text-success border-success/20"><CheckCircle className="h-3 w-3 mr-1" />Mastered</Badge>;
      case "in-progress":
        return <Badge className="bg-info/10 text-info border-info/20"><PlayCircle className="h-3 w-3 mr-1" />In Progress</Badge>;
      default:
        return <Badge variant="outline"><Target className="h-3 w-3 mr-1" />Not Started</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Learning Profile Summary */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Your Learning Profile</h3>
                <p className="text-sm text-muted-foreground">
                  Diagnostic: {learningProfile.diagnosticScore.toFixed(0)}% • 
                  Style: {learningProfile.learningStyle.replace("-", " ").replace(/\b\w/g, c => c.toUpperCase())}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowFocusCheck(true)}>
                <Clock className="h-4 w-4 mr-2" />
                Focus Check
              </Button>
              <Button variant="ghost" size="sm" onClick={onResetProfile}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset Profile
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Focus Check Modal */}
      {showFocusCheck && (
        <FocusCheck
          currentFocus={focusLevel}
          onFocusUpdate={(level) => {
            setFocusLevel(level);
            setShowFocusCheck(false);
          }}
          onClose={() => setShowFocusCheck(false)}
        />
      )}

      {/* Focus Alert */}
      {focusLevel === "low" && (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center">
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                Low focus detected. Consider taking a short break or we'll simplify explanations for you.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chapter Overview */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-info" />
              </div>
              <div>
                <CardTitle className="text-xl">{chapterData.title}</CardTitle>
                <CardDescription>{chapterData.description}</CardDescription>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Overall Progress</span>
              <span className="font-medium text-foreground">{masteredCount}/{totalConcepts} concepts mastered</span>
            </div>
            <Progress value={overallProgress} className="h-2" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {chapterData.concepts.map((concept) => {
              const status = getConceptStatus(concept.id);
              const isUnlocked = isConceptUnlocked(concept);
              const progress = conceptProgress.find((p) => p.conceptId === concept.id);

              return (
                <div
                  key={concept.id}
                  className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                    isUnlocked
                      ? "border-border hover:border-primary/50 hover:bg-muted/30 cursor-pointer"
                      : "border-border/50 bg-muted/20 opacity-60"
                  }`}
                  onClick={() => isUnlocked && onConceptSelect(concept.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      status === "mastered" ? "bg-success/10" :
                      status === "in-progress" ? "bg-info/10" : "bg-muted/50"
                    }`}>
                      {status === "mastered" ? (
                        <CheckCircle className="h-5 w-5 text-success" />
                      ) : status === "in-progress" ? (
                        <PlayCircle className="h-5 w-5 text-info" />
                      ) : isUnlocked ? (
                        <Target className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <Lock className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-foreground">{concept.title}</h4>
                        {progress && (progress.attempts > 0 || progress.quizScore > 0) && (
                          <ConceptPulse
                            quizScore={progress.quizScore}
                            timeSpent={progress.timeSpent}
                            attempts={progress.attempts}
                          />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{concept.description}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          ~{concept.estimatedTime} min
                        </span>
                        {progress?.quizScore !== undefined && progress.quizScore > 0 && (
                          <span className="flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            Quiz: {progress.quizScore}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(status, isUnlocked)}
                    {isUnlocked && <ChevronRight className="h-5 w-5 text-muted-foreground" />}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChapterView;
