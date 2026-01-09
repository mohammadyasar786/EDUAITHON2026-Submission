import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { GraduationCap, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface NPTELSuggestionProps {
  conceptId: string;
  conceptTitle: string;
}

interface NPTELLecture {
  title: string;
  courseUrl: string;
  instructor?: string;
  institution?: string;
}

const NPTELSuggestion = ({ conceptId, conceptTitle }: NPTELSuggestionProps) => {
  const [lecture, setLecture] = useState<NPTELLecture | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchNPTELSuggestion();
  }, [conceptId]);

  const fetchNPTELSuggestion = async () => {
    setIsLoading(true);
    setError(false);
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke("nptel-suggestion", {
        body: { conceptId, conceptTitle },
      });

      if (fnError) throw fnError;
      
      if (data?.lecture) {
        setLecture(data.lecture);
      }
    } catch (err) {
      console.error("Error fetching NPTEL suggestion:", err);
      setError(true);
      // Use fallback lecture based on concept
      setLecture(getFallbackLecture(conceptId, conceptTitle));
    } finally {
      setIsLoading(false);
    }
  };

  const getFallbackLecture = (id: string, title: string): NPTELLecture => {
    // Curated fallback NPTEL courses for common CS concepts
    const fallbacks: Record<string, NPTELLecture> = {
      arrays: {
        title: "Data Structures and Algorithms - Arrays",
        courseUrl: "https://nptel.ac.in/courses/106102064",
        instructor: "Prof. Naveen Garg",
        institution: "IIT Delhi"
      },
      "stacks-queues": {
        title: "Data Structures - Stacks and Queues",
        courseUrl: "https://nptel.ac.in/courses/106102064",
        instructor: "Prof. Naveen Garg",
        institution: "IIT Delhi"
      },
      "linked-lists": {
        title: "Programming and Data Structures - Linked Lists",
        courseUrl: "https://nptel.ac.in/courses/106105085",
        instructor: "Prof. P.P. Chakraborty",
        institution: "IIT Kharagpur"
      },
      trees: {
        title: "Data Structures - Trees and Binary Trees",
        courseUrl: "https://nptel.ac.in/courses/106102064",
        instructor: "Prof. Naveen Garg",
        institution: "IIT Delhi"
      },
      sorting: {
        title: "Design and Analysis of Algorithms - Sorting",
        courseUrl: "https://nptel.ac.in/courses/106101060",
        instructor: "Prof. Madhavan Mukund",
        institution: "Chennai Mathematical Institute"
      },
      searching: {
        title: "Programming and Data Structures - Searching",
        courseUrl: "https://nptel.ac.in/courses/106105085",
        instructor: "Prof. P.P. Chakraborty",
        institution: "IIT Kharagpur"
      },
      "hash-tables": {
        title: "Data Structures and Algorithms - Hashing",
        courseUrl: "https://nptel.ac.in/courses/106102064",
        instructor: "Prof. Naveen Garg",
        institution: "IIT Delhi"
      },
      graphs: {
        title: "Design and Analysis of Algorithms - Graph Algorithms",
        courseUrl: "https://nptel.ac.in/courses/106101060",
        instructor: "Prof. Madhavan Mukund",
        institution: "Chennai Mathematical Institute"
      },
    };

    return fallbacks[id] || {
      title: `${title} - NPTEL Course`,
      courseUrl: "https://nptel.ac.in/courses/106102064",
      instructor: "Prof. Naveen Garg",
      institution: "IIT Delhi"
    };
  };

  if (isLoading) {
    return (
      <Card className="border-border/30 bg-muted/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Finding relevant NPTEL lecture...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!lecture) return null;

  return (
    <Card className="border-border/30 bg-muted/20 hover:bg-muted/30 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <GraduationCap className="h-5 w-5 text-primary" />
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground mb-1">
              NPTEL Academic Video (Optional)
            </p>
            <h4 className="font-medium text-sm text-foreground truncate">
              {lecture.title}
            </h4>
            {lecture.instructor && (
              <p className="text-xs text-muted-foreground mt-1">
                {lecture.instructor} • {lecture.institution}
              </p>
            )}
          </div>

          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <a
              href={lecture.courseUrl}
              target="_blank"
              rel="noopener noreferrer"
              referrerPolicy="no-referrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 underline underline-offset-4 transition-colors"
            >
              Open on NPTEL ↗
            </a>
            <a
              href="https://leetcode.com/problems/maximum-subarray/description/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-orange-500 hover:text-orange-400 underline underline-offset-4 transition-colors"
            >
              Practice on LeetCode ↗
            </a>
            <span className="text-[10px] text-muted-foreground text-right">
              Academic & practice resources (optional)
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NPTELSuggestion;
