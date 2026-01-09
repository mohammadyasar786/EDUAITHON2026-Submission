import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, BookOpen, TrendingUp, Clock, CheckCircle, ArrowUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { ConceptProgress } from "@/pages/AdaptiveLearning";
import ConceptPulse from "./ConceptPulse";

interface TimelineEvent {
  id: string;
  conceptId: string;
  conceptTitle: string;
  eventType: "started" | "revised" | "improved" | "mastered";
  timestamp: string;
  details?: {
    previousScore?: number;
    newScore?: number;
    previousPulse?: string;
    newPulse?: string;
    timeSpent?: number;
  };
}

interface LearningTimelineProps {
  conceptProgress: ConceptProgress[];
}

const conceptTitles: Record<string, string> = {
  arrays: "Arrays and Lists",
  "stacks-queues": "Stacks and Queues",
  "linked-lists": "Linked Lists",
  trees: "Trees and Binary Trees",
  sorting: "Sorting Algorithms",
  searching: "Searching Algorithms",
  "hash-tables": "Hash Tables",
  graphs: "Graphs and Graph Algorithms",
};

const LearningTimeline = ({ conceptProgress }: LearningTimelineProps) => {
  const { user } = useAuth();
  const [events, setEvents] = useState<TimelineEvent[]>([]);

  useEffect(() => {
    // Generate timeline events from concept progress
    const timelineEvents: TimelineEvent[] = [];
    
    conceptProgress.forEach((progress) => {
      const conceptTitle = conceptTitles[progress.conceptId] || progress.conceptId;
      
      // Add event for each concept that has been started
      if (progress.timeSpent > 0 || progress.attempts > 0) {
        // Started event
        timelineEvents.push({
          id: `${progress.conceptId}-started`,
          conceptId: progress.conceptId,
          conceptTitle,
          eventType: "started",
          timestamp: new Date(Date.now() - progress.timeSpent * 1000).toISOString(),
          details: { timeSpent: progress.timeSpent },
        });

        // If mastered
        if (progress.status === "mastered") {
          timelineEvents.push({
            id: `${progress.conceptId}-mastered`,
            conceptId: progress.conceptId,
            conceptTitle,
            eventType: "mastered",
            timestamp: new Date().toISOString(),
            details: { newScore: progress.quizScore },
          });
        }

        // If multiple attempts, add revision event
        if (progress.attempts > 1) {
          timelineEvents.push({
            id: `${progress.conceptId}-revised`,
            conceptId: progress.conceptId,
            conceptTitle,
            eventType: "revised",
            timestamp: new Date(Date.now() - 60000).toISOString(),
            details: { previousScore: Math.max(0, progress.quizScore - 20), newScore: progress.quizScore },
          });
        }
      }
    });

    // Sort by timestamp descending
    timelineEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setEvents(timelineEvents);
  }, [conceptProgress]);

  const getEventIcon = (eventType: TimelineEvent["eventType"]) => {
    switch (eventType) {
      case "started":
        return <BookOpen className="h-4 w-4 text-info" />;
      case "revised":
        return <Clock className="h-4 w-4 text-amber-500" />;
      case "improved":
        return <ArrowUp className="h-4 w-4 text-emerald-500" />;
      case "mastered":
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
    }
  };

  const getEventLabel = (eventType: TimelineEvent["eventType"]) => {
    switch (eventType) {
      case "started":
        return "Started Learning";
      case "revised":
        return "Revised Concept";
      case "improved":
        return "Understanding Improved";
      case "mastered":
        return "Concept Mastered";
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  if (events.length === 0) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="py-12 text-center">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">Your learning journey will appear here as you progress.</p>
          <p className="text-sm text-muted-foreground mt-1">Start learning a concept to see your timeline!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>My Learning Journey</CardTitle>
            <CardDescription>Track your growth over time</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
            
            {/* Timeline events */}
            <div className="space-y-6">
              {events.map((event, index) => {
                const progress = conceptProgress.find(p => p.conceptId === event.conceptId);
                return (
                  <div key={event.id} className="relative flex gap-4 pl-10">
                    {/* Timeline dot */}
                    <div className="absolute left-2 w-4 h-4 rounded-full bg-background border-2 border-primary flex items-center justify-center">
                      {event.eventType === "mastered" && (
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      )}
                    </div>
                    
                    {/* Event card */}
                    <div className="flex-1 p-3 rounded-lg bg-muted/30 border border-border/50">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {getEventIcon(event.eventType)}
                          <span className="font-medium text-sm text-foreground">
                            {event.conceptTitle}
                          </span>
                          {progress && (
                            <ConceptPulse
                              quizScore={progress.quizScore}
                              timeSpent={progress.timeSpent}
                              attempts={progress.attempts}
                              className="ml-1"
                            />
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatTimeAgo(event.timestamp)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs">
                          {getEventLabel(event.eventType)}
                        </Badge>
                        {event.details?.newScore !== undefined && (
                          <Badge variant="outline" className="text-xs">
                            Score: {event.details.newScore}%
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default LearningTimeline;
