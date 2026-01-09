import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import { BookOpen, Play, X, ClipboardCheck, Layers, ArrowRightLeft, Grid3X3, Video } from "lucide-react";
import ARScene from "@/components/AR3DModels/ARScene";
import ARQuiz from "@/components/ARQuiz";
import ConceptVideoSection from "@/components/AR3DModels/ConceptVideoSection";
import { toast } from "sonner";
import { AIVAButton } from "@/components/AIVA";
import { useLearningStreak } from "@/hooks/useLearningStreak";
import { useAuth } from "@/hooks/useAuth";

type ModelType = "stack" | "queue" | "array";

interface ARModule {
  id: ModelType;
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
}

const ARLearning = () => {
  const { user } = useAuth();
  const { updateStreak } = useLearningStreak();
  const [activeModel, setActiveModel] = useState<ModelType | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizTopic, setQuizTopic] = useState<ModelType>("stack");

  // Update streak when user visits AR Learning
  useEffect(() => {
    if (user) {
      updateStreak();
    }
  }, [user, updateStreak]);

  const arModules: ARModule[] = [
    {
      id: "stack",
      icon: Layers,
      title: "Stack Data Structure",
      description: "Visualize LIFO (Last In, First Out) operations with push and pop",
      color: "success"
    },
    {
      id: "queue",
      icon: ArrowRightLeft,
      title: "Queue Data Structure",
      description: "Understand FIFO (First In, First Out) with enqueue and dequeue",
      color: "info"
    },
    {
      id: "array",
      icon: Grid3X3,
      title: "Arrays and Lists",
      description: "See how arrays store data in contiguous memory with indexed access",
      color: "accent"
    }
  ];

  const getModelTitle = (modelId: ModelType) => {
    const module = arModules.find(m => m.id === modelId);
    return module?.title || "";
  };

  const handleStartQuiz = (topic: ModelType) => {
    setQuizTopic(topic);
    setShowQuiz(true);
    setActiveModel(null);
  };

  const handleQuizComplete = (score: number, total: number) => {
    const percentage = Math.round((score / total) * 100);
    if (percentage >= 75) {
      toast.success(`Excellent! You scored ${score}/${total} (${percentage}%)! 🎉`);
    } else if (percentage >= 50) {
      toast.info(`Good effort! You scored ${score}/${total} (${percentage}%)`);
    } else {
      toast.info(`You scored ${score}/${total}. Keep learning! 📚`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="pt-20 pb-8 px-4 container mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-12 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-info/10 border border-info/20 text-info">
            <BookOpen className="h-4 w-4" />
            <span className="text-sm font-medium">AR-Teach 360</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold">
            Visualize Complex Concepts in{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-500 via-violet-500 to-fuchsia-500">
              Interactive 3D
            </span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Transform abstract ideas into interactive 3D experiences. Rotate, zoom, and explore concepts in ways textbooks never could.
          </p>
        </div>

        {/* Quiz Modal */}
        {showQuiz && (
          <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5 text-primary" />
                  {getModelTitle(quizTopic)} Quiz
                </h2>
                <Button variant="ghost" size="sm" onClick={() => setShowQuiz(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <ARQuiz
                topic={quizTopic}
                onComplete={handleQuizComplete}
                onClose={() => setShowQuiz(false)}
              />
            </div>
          </div>
        )}

        {/* 3D Viewer Modal */}
        {activeModel && (
          <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-4xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">{getModelTitle(activeModel)}</h2>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleStartQuiz(activeModel)}
                    className="border-primary text-primary hover:bg-primary/10"
                  >
                    <ClipboardCheck className="h-4 w-4 mr-2" />
                    Take Quiz
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setActiveModel(null)}>
                    <X className="h-4 w-4 mr-2" />
                    Close
                  </Button>
                </div>
              </div>
              <div className="aspect-video rounded-xl border-2 overflow-hidden">
                <ARScene modelType={activeModel} />
              </div>
              <p className="text-center text-sm text-muted-foreground mt-4">
                Click and drag to rotate • Scroll to zoom • Interactive 3D model
              </p>
            </div>
          </div>
        )}

        {/* Featured AR Experience */}
        <Card className="mb-12 overflow-hidden border-2">
          <div className="grid md:grid-cols-2">
            <div className="aspect-square md:aspect-auto bg-gradient-to-br from-info/20 via-primary/20 to-accent/20 relative">
              <div className="absolute inset-0">
                <ARScene modelType="stack" />
              </div>
            </div>
            <div className="p-8 flex flex-col justify-center">
              <h3 className="text-2xl font-bold mb-2">Stack Data Structure</h3>
              <p className="text-muted-foreground mb-6">
                Explore the LIFO (Last In, First Out) principle in stunning 3D. Watch how push and pop operations work with stacked elements.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button 
                  size="lg" 
                  className="gradient-primary text-primary-foreground shadow-primary"
                  onClick={() => setActiveModel("stack")}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Launch Full View
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => handleStartQuiz("stack")}
                  className="border-primary text-primary hover:bg-primary/10"
                >
                  <ClipboardCheck className="h-4 w-4 mr-2" />
                  Take Quiz
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* AR Modules Grid */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Available AR Learning Modules</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {arModules.map((module, index) => (
              <Card 
                key={index} 
                className="overflow-hidden hover:shadow-elevation transition-all duration-300 border-2 hover:border-primary/20 group"
              >
                <div 
                  className="aspect-video relative bg-gradient-to-br from-muted to-muted/50 cursor-pointer"
                  onClick={() => setActiveModel(module.id)}
                >
                  <ARScene modelType={module.id} />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className={`inline-flex p-2 rounded-lg bg-${module.color}/20 mb-2`}>
                      <module.icon className={`h-5 w-5 text-${module.color}`} />
                    </div>
                    <h3 className="text-lg font-bold group-hover:text-primary transition-colors">
                      {module.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {module.description}
                    </p>
                  </div>
                </div>
                <div className="p-4 border-t flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => setActiveModel(module.id)}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    View 3D
                  </Button>
                  <Button 
                    size="sm" 
                    className="flex-1 gradient-primary text-primary-foreground"
                    onClick={() => handleStartQuiz(module.id)}
                  >
                    <ClipboardCheck className="h-4 w-4 mr-2" />
                    Quiz
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Video Learning Section */}
        <div className="mb-12 space-y-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-info/10">
              <Video className="h-5 w-5 text-info" />
            </div>
            <h2 className="text-2xl font-bold">Video Tutorials</h2>
          </div>
          <ConceptVideoSection topic="array" />
          <ConceptVideoSection topic="stack" />
          <ConceptVideoSection topic="queue" />
        </div>
        <Card className="p-8 bg-gradient-to-br from-primary/5 to-info/5 border-2">
          <h2 className="text-2xl font-bold mb-6 text-center">How AR-Teach 360 Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center space-y-3">
              <div className="inline-flex p-4 rounded-xl gradient-primary shadow-primary">
                <span className="text-2xl text-primary-foreground font-bold">1</span>
              </div>
              <h3 className="font-semibold">Choose Your Topic</h3>
              <p className="text-sm text-muted-foreground">
                Select from our library of interactive 3D learning modules
              </p>
            </div>
            <div className="text-center space-y-3">
              <div className="inline-flex p-4 rounded-xl gradient-info shadow-primary">
                <span className="text-2xl text-info-foreground font-bold">2</span>
              </div>
              <h3 className="font-semibold">Interact in 3D</h3>
              <p className="text-sm text-muted-foreground">
                Rotate, zoom, and explore concepts in stunning detail
              </p>
            </div>
            <div className="text-center space-y-3">
              <div className="inline-flex p-4 rounded-xl gradient-accent shadow-accent">
                <span className="text-2xl text-accent-foreground font-bold">3</span>
              </div>
              <h3 className="font-semibold">Test Your Knowledge</h3>
              <p className="text-sm text-muted-foreground">
                Take quizzes to reinforce learning and track progress
              </p>
            </div>
          </div>
        </Card>
      </div>

      <AIVAButton 
        context={{ topic: activeModel ? getModelTitle(activeModel) : "AR Learning" }} 
        learningStyle="visual" 
      />
    </div>
  );
};

export default ARLearning;
