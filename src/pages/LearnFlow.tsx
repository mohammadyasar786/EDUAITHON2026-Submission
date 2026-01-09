import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Navigation from "@/components/Navigation";
import { TrendingUp, Target, BookOpen, Award, ArrowRight, CheckCircle2, Loader2, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ModuleView from "@/components/LearnFlow/ModuleView";
import ConceptLesson from "@/components/LearnFlow/ConceptLesson";
import { AIVAButton } from "@/components/AIVA";

interface LearningModule {
  title: string;
  topics: string[];
  icon: typeof CheckCircle2;
}

interface Recommendation {
  type: string;
  title: string;
  reason: string;
  priority?: string;
  module?: string;
  concept?: string;
}

const LearnFlow = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [encouragement, setEncouragement] = useState("");
  const [selectedModule, setSelectedModule] = useState<LearningModule | null>(null);
  const [selectedConcept, setSelectedConcept] = useState<string | null>(null);
  const [completedConcepts, setCompletedConcepts] = useState<string[]>([]);

  const learningModules: LearningModule[] = [
    {
      title: "Introduction to Python",
      topics: ["Variables", "Data Types", "Operators"],
      icon: CheckCircle2
    },
    {
      title: "Control Flow",
      topics: ["If Statements", "Loops", "Functions"],
      icon: Target
    },
    {
      title: "Data Structures",
      topics: ["Lists", "Dictionaries", "Sets"],
      icon: BookOpen
    },
    {
      title: "Object-Oriented Programming",
      topics: ["Classes", "Inheritance", "Polymorphism"],
      icon: Award
    }
  ];

  const [recommendations, setRecommendations] = useState<Recommendation[]>([
    { type: "review", title: "Review: Python Functions", reason: "Strengthen your understanding", module: "Control Flow", concept: "Functions" },
    { type: "practice", title: "Practice: Loop Exercises", reason: "Build coding muscle memory", module: "Control Flow", concept: "Loops" },
    { type: "advance", title: "Ready: Data Structures", reason: "You've mastered the prerequisites", module: "Data Structures", concept: "Lists" }
  ]);

  useEffect(() => {
    if (!authLoading && !user) {
      toast.error("Please sign in to use LearnFlow");
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const getModuleProgress = (module: LearningModule) => {
    const completed = module.topics.filter(t => completedConcepts.includes(t)).length;
    return Math.round((completed / module.topics.length) * 100);
  };

  const getModuleStatus = (module: LearningModule, index: number) => {
    const progress = getModuleProgress(module);
    if (progress === 100) return "completed";
    if (progress > 0) return "current";
    // Check if previous module is complete
    if (index === 0) return "current";
    const prevModule = learningModules[index - 1];
    const prevProgress = getModuleProgress(prevModule);
    return prevProgress === 100 ? "next" : "available";
  };

  const fetchRecommendations = async () => {
    setIsLoadingRecommendations(true);
    try {
      const { data, error } = await supabase.functions.invoke("learning-recommendations", {
        body: {
          progress: {
            completed: completedConcepts.length,
            inProgress: 1,
            overall: Math.round((completedConcepts.length / 12) * 100)
          },
          recentTopics: completedConcepts.slice(-4)
        }
      });
      if (error) throw error;
      if (data.recommendations && data.recommendations.length > 0) {
        setRecommendations(data.recommendations);
      }
      if (data.encouragement) {
        setEncouragement(data.encouragement);
        toast.success(data.encouragement);
      }
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      toast.error("Couldn't fetch personalized recommendations");
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  const handleConceptComplete = (concept: string) => {
    if (!completedConcepts.includes(concept)) {
      setCompletedConcepts(prev => [...prev, concept]);
      toast.success(`Completed: ${concept}!`);
    }
    setSelectedConcept(null);
  };

  const totalConcepts = learningModules.reduce((acc, m) => acc + m.topics.length, 0);
  const overallProgress = Math.round((completedConcepts.length / totalConcepts) * 100);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Show concept lesson view
  if (selectedConcept && selectedModule) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-20 pb-8 px-4 container mx-auto max-w-4xl">
          <ConceptLesson
            concept={selectedConcept}
            moduleName={selectedModule.title}
            onBack={() => setSelectedConcept(null)}
            onComplete={handleConceptComplete}
          />
        </div>
      </div>
    );
  }

  // Show module view
  if (selectedModule) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-20 pb-8 px-4 container mx-auto max-w-4xl">
          <ModuleView
            module={selectedModule}
            completedConcepts={completedConcepts}
            onBack={() => setSelectedModule(null)}
            onSelectConcept={setSelectedConcept}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="pt-20 pb-8 px-4 container mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-12 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm font-medium">LearnFlow Path</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold">
            Your Personalized{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-500 via-violet-500 to-fuchsia-500">
              Learning Journey
            </span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            AI-powered adaptive learning that evolves with your progress. Click any module to start learning!
          </p>
        </div>

        {/* Overall Progress */}
        <Card className="mb-8 p-8 border-2 bg-gradient-to-br from-primary/5 to-accent/5 rounded-3xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Overall Progress</h2>
            <span className="text-3xl font-bold text-primary">{overallProgress}%</span>
          </div>
          <Progress value={overallProgress} className="h-3 mb-4" />
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-success">{completedConcepts.length}</div>
              <div className="text-sm text-muted-foreground">Concepts Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{totalConcepts - completedConcepts.length}</div>
              <div className="text-sm text-muted-foreground">Remaining</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-muted-foreground">{learningModules.length}</div>
              <div className="text-sm text-muted-foreground">Modules</div>
            </div>
          </div>
        </Card>

        {/* Learning Path */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">Your Learning Path</h2>
          <div className="space-y-4">
            {learningModules.map((module, index) => {
              const status = getModuleStatus(module, index);
              const progress = getModuleProgress(module);
              const Icon = module.icon;

              return (
                <Card
                  key={index}
                  className={`p-6 border-2 transition-all duration-300 cursor-pointer hover:scale-[1.01] ${
                    status === "current" 
                      ? "border-primary shadow-primary" 
                      : status === "completed" 
                        ? "border-success/30" 
                        : "hover:border-primary/20"
                  }`}
                  onClick={() => setSelectedModule(module)}
                >
                  <div className="flex items-start gap-4">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                      status === "completed" 
                        ? "gradient-success shadow-primary" 
                        : status === "current" 
                          ? "gradient-primary shadow-primary" 
                          : "gradient-info"
                    }`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-bold">{module.title}</h3>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-muted-foreground">
                            {progress}%
                          </span>
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </div>

                      <Progress value={progress} className="h-2 mb-3" />

                      <div className="flex flex-wrap gap-2 mb-3">
                        {module.topics.map((topic, topicIndex) => (
                          <span
                            key={topicIndex}
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              completedConcepts.includes(topic)
                                ? "bg-success/20 text-success"
                                : "bg-muted"
                            }`}
                          >
                            {completedConcepts.includes(topic) && "✓ "}
                            {topic}
                          </span>
                        ))}
                      </div>

                      {status === "current" && (
                        <Button size="sm" className="gradient-primary text-primary-foreground">
                          Continue Learning
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* AI Recommendations */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">AI Recommendations</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchRecommendations}
              disabled={isLoadingRecommendations}
              className="rounded-full"
            >
              {isLoadingRecommendations ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                "Get Fresh Recommendations"
              )}
            </Button>
          </div>
          
          {encouragement && (
            <Card className="mb-6 p-4 border-2 border-success/30 bg-success/5">
              <p className="text-sm text-center font-medium">{encouragement}</p>
            </Card>
          )}

          <div className="grid md:grid-cols-3 gap-6">
            {recommendations.map((rec, index) => {
              const handleRecommendationClick = () => {
                // Find the matching module and navigate to it
                const targetModule = learningModules.find(m => 
                  rec.module ? m.title === rec.module : m.topics.some(t => rec.title.toLowerCase().includes(t.toLowerCase()))
                );
                
                if (targetModule) {
                  setSelectedModule(targetModule);
                  if (rec.concept) {
                    setSelectedConcept(rec.concept);
                  }
                  toast.success(`Opening: ${rec.title}`);
                } else {
                  // Default to first module if no match
                  setSelectedModule(learningModules[0]);
                  toast.info(`Starting with: ${learningModules[0].title}`);
                }
              };

              return (
                <Card
                  key={index}
                  onClick={handleRecommendationClick}
                  className="p-6 border-2 hover:border-primary/20 transition-all hover:-translate-y-1 cursor-pointer rounded-3xl"
                >
                  <div className={`inline-flex p-3 rounded-xl mb-4 ${
                    rec.type === "review" 
                      ? "bg-accent/10" 
                      : rec.type === "practice" 
                        ? "bg-info/10" 
                        : "bg-success/10"
                  }`}>
                    <TrendingUp className={`h-6 w-6 ${
                      rec.type === "review" 
                        ? "text-accent" 
                        : rec.type === "practice" 
                          ? "text-info" 
                          : "text-success"
                    }`} />
                  </div>
                  <div className="uppercase text-xs font-bold text-muted-foreground mb-2">
                    {rec.type}
                  </div>
                  <h3 className="text-lg font-bold mb-2">{rec.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{rec.reason}</p>
                  <Button variant="outline" size="sm" className="w-full rounded-full">
                    Start Now
                  </Button>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* AIVA Floating AI Companion */}
      <AIVAButton 
        context={{
          concept: selectedConcept || undefined,
          chapter: selectedModule?.title,
          topic: "LearnFlow"
        }}
      />
    </div>
  );
};

export default LearnFlow;
