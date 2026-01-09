import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, CheckCircle2, Circle, Play } from "lucide-react";

interface ModuleViewProps {
  module: {
    title: string;
    topics: string[];
  };
  completedConcepts: string[];
  onBack: () => void;
  onSelectConcept: (concept: string) => void;
}

const ModuleView = ({ module, completedConcepts, onBack, onSelectConcept }: ModuleViewProps) => {
  const completedCount = module.topics.filter(t => completedConcepts.includes(t)).length;
  const moduleProgress = Math.round((completedCount / module.topics.length) * 100);

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Learning Path
      </Button>

      <Card className="p-8 border-2 rounded-3xl bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">{module.title}</h2>
          <span className="text-2xl font-bold text-primary">{moduleProgress}%</span>
        </div>
        <Progress value={moduleProgress} className="h-3 mb-4" />
        <p className="text-muted-foreground">
          {completedCount} of {module.topics.length} concepts completed
        </p>
      </Card>

      <div className="space-y-4">
        <h3 className="text-xl font-bold">Concepts</h3>
        {module.topics.map((topic, index) => {
          const isCompleted = completedConcepts.includes(topic);
          
          return (
            <Card
              key={topic}
              className={`p-6 border-2 cursor-pointer transition-all hover:scale-[1.01] hover:shadow-lg ${
                isCompleted ? 'border-success/30 bg-success/5' : 'hover:border-primary/50'
              }`}
              onClick={() => onSelectConcept(topic)}
            >
              <div className="flex items-center gap-4">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                  isCompleted ? 'bg-success text-success-foreground' : 'bg-muted'
                }`}>
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-bold">{index + 1}</span>
                  )}
                </div>
                
                <div className="flex-1">
                  <h4 className="font-semibold">{topic}</h4>
                  <p className="text-sm text-muted-foreground">
                    {isCompleted ? 'Completed' : 'Click to start learning'}
                  </p>
                </div>

                <Button 
                  variant={isCompleted ? "outline" : "default"}
                  size="sm"
                  className={isCompleted ? "" : "gradient-primary text-primary-foreground"}
                >
                  {isCompleted ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Review
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Start
                    </>
                  )}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default ModuleView;
