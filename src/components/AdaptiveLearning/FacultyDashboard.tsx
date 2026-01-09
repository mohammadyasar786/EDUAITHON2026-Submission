import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Upload, Save, BookOpen, BarChart3, AlertTriangle, Users, Target, CheckCircle, TrendingUp, FileText, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import type { ConceptProgress } from "@/pages/AdaptiveLearning";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface FacultyDashboardProps {
  conceptProgress: ConceptProgress[];
}

interface ChapterContent {
  title: string;
  content: string;
  objectives: string[];
  misconceptions: string[];
  lectureNotes: string;
  pdfUrl: string | null;
}

// Focused on Arrays, Stacks, and Queues only
const conceptData = [{
  id: "arrays",
  title: "Arrays"
}, {
  id: "stacks",
  title: "Stacks"
}, {
  id: "queues",
  title: "Queues"
}];

const FacultyDashboard = ({ conceptProgress }: FacultyDashboardProps) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [chapterContent, setChapterContent] = useState<ChapterContent>({
    title: "Arrays, Stacks, and Queues",
    content: "",
    objectives: [],
    misconceptions: [],
    lectureNotes: "",
    pdfUrl: null,
  });
  const [newObjective, setNewObjective] = useState("");
  const [newMisconception, setNewMisconception] = useState("");

  // Load existing content from Supabase
  useEffect(() => {
    const loadContent = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from("chapter_content")
          .select("*")
          .eq("user_id", user.id)
          .eq("chapter_id", "arrays-stacks-queues")
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setChapterContent({
            title: data.title || "Arrays, Stacks, and Queues",
            content: data.content || "",
            objectives: Array.isArray(data.learning_objectives) ? data.learning_objectives as string[] : [],
            misconceptions: Array.isArray(data.common_misconceptions) ? data.common_misconceptions as string[] : [],
            lectureNotes: data.lecture_notes || "",
            pdfUrl: data.pdf_url || null,
          });
        }
      } catch (error) {
        console.error("Error loading chapter content:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadContent();
  }, [user]);

  const handleSaveContent = async () => {
    if (!user) {
      toast.error("You must be logged in to save content");
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("chapter_content")
        .upsert({
          user_id: user.id,
          chapter_id: "arrays-stacks-queues",
          title: chapterContent.title,
          content: chapterContent.content,
          learning_objectives: chapterContent.objectives,
          common_misconceptions: chapterContent.misconceptions,
          lecture_notes: chapterContent.lectureNotes,
          pdf_url: chapterContent.pdfUrl,
        }, {
          onConflict: "user_id,chapter_id",
        });

      if (error) throw error;
      toast.success("Chapter content saved successfully");
    } catch (error) {
      console.error("Error saving content:", error);
      toast.error("Failed to save chapter content");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.type !== "application/pdf") {
      toast.error("Only PDF files are allowed");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setIsUploading(true);
    try {
      const fileName = `${user.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("learning-materials")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("learning-materials")
        .getPublicUrl(fileName);

      setChapterContent(prev => ({ ...prev, pdfUrl: publicUrl }));
      toast.success("PDF uploaded successfully");
    } catch (error) {
      console.error("Error uploading PDF:", error);
      toast.error("Failed to upload PDF");
    } finally {
      setIsUploading(false);
    }
  };

  const removePdf = () => {
    setChapterContent(prev => ({ ...prev, pdfUrl: null }));
  };

  const addObjective = () => {
    if (!newObjective.trim()) return;
    setChapterContent(prev => ({
      ...prev,
      objectives: [...prev.objectives, newObjective.trim()]
    }));
    setNewObjective("");
  };

  const removeObjective = (index: number) => {
    setChapterContent(prev => ({
      ...prev,
      objectives: prev.objectives.filter((_, i) => i !== index)
    }));
  };

  const addMisconception = () => {
    if (!newMisconception.trim()) return;
    setChapterContent(prev => ({
      ...prev,
      misconceptions: [...prev.misconceptions, newMisconception.trim()]
    }));
    setNewMisconception("");
  };

  const removeMisconception = (index: number) => {
    setChapterContent(prev => ({
      ...prev,
      misconceptions: prev.misconceptions.filter((_, i) => i !== index)
    }));
  };

  // Calculate analytics
  const getConceptAnalytics = (conceptId: string) => {
    const progress = conceptProgress.find(p => p.conceptId === conceptId);
    return {
      status: progress?.status || "not-started",
      avgScore: progress?.quizScore || 0,
      attempts: progress?.attempts || 0,
      timeSpent: progress?.timeSpent || 0
    };
  };

  const overallStats = {
    totalStudents: 1,
    masteredConcepts: conceptProgress.filter(p => p.status === "mastered").length,
    avgScore: conceptProgress.length > 0 ? conceptProgress.reduce((acc, p) => acc + (p.quizScore || 0), 0) / conceptProgress.length : 0,
    totalTimeSpent: conceptProgress.reduce((acc, p) => acc + (p.timeSpent || 0), 0)
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Tabs defaultValue="setup" className="w-full">
      <TabsList className="mb-6">
        <TabsTrigger value="setup" className="gap-2">
          <Upload className="h-4 w-4" />
          Chapter Setup
        </TabsTrigger>
        <TabsTrigger value="insights" className="gap-2">
          <BarChart3 className="h-4 w-4" />
          Learning Insights
        </TabsTrigger>
      </TabsList>

      <TabsContent value="setup" className="space-y-6">
        {/* Chapter Content */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm rounded-3xl">
          <CardHeader className="rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Chapter Content</CardTitle>
                <CardDescription>Upload or paste chapter content for AI processing</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 rounded-2xl">
            <div className="space-y-2">
              <Label htmlFor="title">Chapter Title</Label>
              <Input
                id="title"
                value={chapterContent.title}
                onChange={e => setChapterContent(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter chapter title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Chapter Content</Label>
              <Textarea
                id="content"
                value={chapterContent.content}
                onChange={e => setChapterContent(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Paste or type the chapter content here. The AI will use this to generate personalized explanations..."
                className="min-h-[200px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lectureNotes">Lecture Notes</Label>
              <Textarea
                id="lectureNotes"
                value={chapterContent.lectureNotes}
                onChange={e => setChapterContent(prev => ({ ...prev, lectureNotes: e.target.value }))}
                placeholder="Add lecture notes that students will see..."
                className="min-h-[150px]"
              />
            </div>
          </CardContent>
        </Card>

        {/* PDF Upload */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm rounded-3xl">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-info" />
              </div>
              <div>
                <CardTitle>PDF Materials</CardTitle>
                <CardDescription>Upload PDF materials for students to access</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {chapterContent.pdfUrl ? (
              <div className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-muted/30">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <a
                    href={chapterContent.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    View uploaded PDF
                  </a>
                </div>
                <Button variant="ghost" size="sm" onClick={removePdf}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-border/50 rounded-lg p-8 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <Label
                  htmlFor="pdf-upload"
                  className="cursor-pointer text-primary hover:underline"
                >
                  {isUploading ? "Uploading..." : "Click to upload PDF (max 10MB)"}
                </Label>
                <Input
                  id="pdf-upload"
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={handlePdfUpload}
                  disabled={isUploading}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Learning Objectives */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm rounded-3xl">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <Target className="h-5 w-5 text-success" />
              </div>
              <div>
                <CardTitle>Learning Objectives</CardTitle>
                <CardDescription>Define what students should learn from this chapter</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {chapterContent.objectives.map((obj, idx) => (
                <Badge key={idx} variant="secondary" className="px-3 py-1 gap-2">
                  <CheckCircle className="h-3 w-3" />
                  {obj}
                  <button onClick={() => removeObjective(idx)} className="ml-1 hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newObjective}
                onChange={e => setNewObjective(e.target.value)}
                placeholder="Add a learning objective"
                onKeyPress={e => e.key === "Enter" && addObjective()}
              />
              <Button onClick={addObjective} variant="outline" className="rounded-3xl">Add</Button>
            </div>
          </CardContent>
        </Card>

        {/* Common Misconceptions */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm rounded-3xl">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <CardTitle>Common Misconceptions</CardTitle>
                <CardDescription>List typical student misunderstandings for targeted feedback</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {chapterContent.misconceptions.map((misc, idx) => (
                <Badge key={idx} variant="outline" className="px-3 py-1 border-amber-500/30 text-amber-600 dark:text-amber-400 gap-2">
                  <AlertTriangle className="h-3 w-3" />
                  {misc}
                  <button onClick={() => removeMisconception(idx)} className="ml-1 hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newMisconception}
                onChange={e => setNewMisconception(e.target.value)}
                placeholder="Add a common misconception"
                onKeyPress={e => e.key === "Enter" && addMisconception()}
              />
              <Button onClick={addMisconception} variant="outline" className="rounded-3xl">Add</Button>
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleSaveContent} size="lg" className="w-full rounded-2xl" disabled={isSaving}>
          {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save Chapter Configuration
        </Button>
      </TabsContent>

      <TabsContent value="insights" className="space-y-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-border/50 bg-card/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{overallStats.totalStudents}</p>
                  <p className="text-xs text-muted-foreground">Active Students</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{overallStats.masteredConcepts}</p>
                  <p className="text-xs text-muted-foreground">Concepts Mastered</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-info" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{overallStats.avgScore.toFixed(0)}%</p>
                  <p className="text-xs text-muted-foreground">Avg Quiz Score</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-accent-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{Math.round(overallStats.totalTimeSpent / 60)}m</p>
                  <p className="text-xs text-muted-foreground">Total Time Spent</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Concept-wise Performance */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Concept-wise Performance</CardTitle>
            <CardDescription>Average scores and engagement per concept</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {conceptData.map(concept => {
                const analytics = getConceptAnalytics(concept.id);
                return (
                  <div key={concept.id} className="flex items-center gap-4">
                    <div className="w-40 shrink-0">
                      <p className="font-medium text-sm text-foreground truncate">{concept.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {analytics.attempts} attempt{analytics.attempts !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="flex-1">
                      <Progress value={analytics.avgScore} className="h-2" />
                    </div>
                    <div className="w-16 text-right">
                      <span className="text-sm font-medium text-foreground">{analytics.avgScore}%</span>
                    </div>
                    <Badge
                      variant={analytics.status === "mastered" ? "default" : analytics.status === "in-progress" ? "secondary" : "outline"}
                      className={analytics.status === "mastered" ? "bg-success/10 text-success" : analytics.status === "in-progress" ? "bg-info/10 text-info" : ""}
                    >
                      {analytics.status.replace("-", " ")}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Common Struggles */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <CardTitle>Frequently Detected Misconceptions</CardTitle>
                <CardDescription>Common areas where students struggle</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {chapterContent.misconceptions.map((misc, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <span className="text-sm text-foreground">{misc}</span>
                  <Badge variant="outline" className="text-muted-foreground">
                    Detected in concepts
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default FacultyDashboard;