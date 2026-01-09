import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BookOpen, Code, FlaskConical, Lightbulb, FileText, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ResearchInsight {
  id: string;
  concept_id: string;
  title: string;
  insight_type: string;
  content: string;
  code_language?: string;
  created_at: string;
}

interface ChapterContent {
  id: string;
  title: string;
  content: string | null;
  learning_objectives: string[];
  common_misconceptions: string[];
  lecture_notes: string | null;
  pdf_url: string | null;
}

interface FacultyResearchContentProps {
  conceptId: string;
}

const insightTypeConfig: Record<string, { label: string; icon: typeof Code }> = {
  code_snippet: { label: "Code Example", icon: Code },
  case_study: { label: "Case Study", icon: BookOpen },
  research_note: { label: "Research Note", icon: FlaskConical },
  real_world_application: { label: "Real-World Application", icon: Lightbulb },
  pdf_resource: { label: "PDF Resource", icon: FileText },
};

const FacultyResearchContent = ({ conceptId }: FacultyResearchContentProps) => {
  const [insights, setInsights] = useState<ResearchInsight[]>([]);
  const [chapterContents, setChapterContents] = useState<ChapterContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchContent();
  }, [conceptId]);

  const fetchContent = async () => {
    setIsLoading(true);
    try {
      // Fetch research insights for this concept (approved only)
      const { data: insightsData, error: insightsError } = await supabase
        .from("research_insights")
        .select("*")
        .eq("concept_id", conceptId)
        .eq("is_approved", true)
        .order("created_at", { ascending: false });

      if (insightsError) {
        console.error("Error fetching insights:", insightsError);
      } else {
        setInsights(insightsData || []);
      }

      // Fetch ALL faculty chapter content (not just one)
      const { data: chapterData, error: chapterError } = await supabase
        .from("chapter_content")
        .select("*")
        .eq("chapter_id", "arrays-stacks-queues")
        .order("created_at", { ascending: false });

      if (chapterError) {
        console.error("Error fetching chapter content:", chapterError);
      } else if (chapterData && chapterData.length > 0) {
        setChapterContents(
          chapterData.map((data) => ({
            id: data.id,
            title: data.title,
            content: data.content,
            learning_objectives: Array.isArray(data.learning_objectives) 
              ? data.learning_objectives as string[]
              : [],
            common_misconceptions: Array.isArray(data.common_misconceptions)
              ? data.common_misconceptions as string[]
              : [],
            lecture_notes: data.lecture_notes,
            pdf_url: data.pdf_url,
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching content:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getInsightIcon = (type: string) => {
    const config = insightTypeConfig[type];
    return config?.icon || FlaskConical;
  };

  // Aggregate all objectives and misconceptions from all faculty
  const allObjectives = chapterContents.flatMap(c => c.learning_objectives);
  const allMisconceptions = chapterContents.flatMap(c => c.common_misconceptions);
  const allLectureNotes = chapterContents.filter(c => c.lecture_notes).map(c => ({ title: c.title, notes: c.lecture_notes! }));
  const allPdfs = chapterContents.filter(c => c.pdf_url).map(c => ({ title: c.title, url: c.pdf_url! }));

  const hasContent = insights.length > 0 || allObjectives.length > 0 || allLectureNotes.length > 0 || allPdfs.length > 0;

  if (isLoading) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
          <span className="text-muted-foreground">Loading additional content...</span>
        </CardContent>
      </Card>
    );
  }

  if (!hasContent) {
    return null;
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
            <FileText className="h-5 w-5 text-accent-foreground" />
          </div>
          <div>
            <CardTitle className="text-lg">Additional Learning Resources</CardTitle>
            <p className="text-sm text-muted-foreground">
              Content from faculty and research experts
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Accordion type="multiple" className="w-full">
          {/* Faculty Learning Objectives */}
          {allObjectives.length > 0 && (
            <AccordionItem value="objectives">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <span>Learning Objectives</span>
                  <Badge variant="secondary" className="ml-2">
                    {allObjectives.length}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-2 pl-6">
                  {allObjectives.map((objective, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground list-disc">
                      {objective}
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Faculty Lecture Notes */}
          {allLectureNotes.length > 0 && (
            <AccordionItem value="lecture-notes">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-info" />
                  <span>Faculty Notes</span>
                  <Badge variant="secondary" className="ml-2">
                    {allLectureNotes.length}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  {allLectureNotes.map((item, idx) => (
                    <div key={idx} className="p-4 rounded-lg border border-border/50 bg-muted/30">
                      <h4 className="font-medium text-foreground text-sm mb-2">{item.title}</h4>
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        {item.notes.split("\n").map((paragraph, pIdx) => (
                          <p key={pIdx} className="text-sm text-muted-foreground mb-2">
                            {paragraph}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Faculty PDFs */}
          {allPdfs.length > 0 && (
            <AccordionItem value="faculty-pdfs">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <span>Course Materials (PDFs)</span>
                  <Badge variant="secondary" className="ml-2">
                    {allPdfs.length}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  {allPdfs.map((pdf, idx) => (
                    <a
                      key={idx}
                      href={pdf.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <FileText className="h-5 w-5 text-primary" />
                      <span className="text-sm text-foreground">{pdf.title}</span>
                    </a>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Common Misconceptions */}
          {allMisconceptions.length > 0 && (
            <AccordionItem value="misconceptions">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  <span>Common Misconceptions</span>
                  <Badge variant="outline" className="ml-2 border-amber-500/30 text-amber-600">
                    Avoid these!
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-2 pl-6">
                  {allMisconceptions.map((misconception, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground list-disc">
                      {misconception}
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Research Expert Insights */}
          {insights.length > 0 && (
            <AccordionItem value="research-insights">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <FlaskConical className="h-4 w-4 text-purple-500" />
                  <span>Expert Insights</span>
                  <Badge variant="secondary" className="ml-2">
                    {insights.length}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  {insights.map((insight) => {
                    const Icon = getInsightIcon(insight.insight_type);
                    const config = insightTypeConfig[insight.insight_type];
                    const isPdf = insight.insight_type === "pdf_resource";
                    
                    return (
                      <div
                        key={insight.id}
                        className="p-4 rounded-lg border border-border/50 bg-muted/30"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                            <Icon className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-medium text-foreground text-sm">
                                {insight.title}
                              </h4>
                              <Badge variant="outline" className="text-xs">
                                {config?.label || insight.insight_type}
                              </Badge>
                              {insight.code_language && (
                                <Badge variant="secondary" className="text-xs">
                                  {insight.code_language}
                                </Badge>
                              )}
                            </div>
                            {isPdf ? (
                              <a
                                href={insight.content}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-2 text-sm text-primary hover:underline flex items-center gap-1"
                              >
                                <FileText className="h-3 w-3" />
                                View PDF
                              </a>
                            ) : insight.insight_type === "code_snippet" ? (
                              <pre className="mt-2 p-3 bg-muted rounded-md overflow-x-auto text-xs">
                                <code>{insight.content}</code>
                              </pre>
                            ) : (
                              <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">
                                {insight.content}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default FacultyResearchContent;
