import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FlaskConical, Code, BookOpen, Lightbulb, Plus, Trash2, Save, FileText, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface ResearchInsight {
  id: string;
  concept_id: string;
  title: string;
  insight_type: string;
  content: string;
  code_language?: string;
  created_at: string;
}

const concepts = [
  { id: "arrays", title: "Arrays" },
  { id: "stacks", title: "Stacks" },
  { id: "queues", title: "Queues" },
];

const insightTypes = [
  { id: "code_snippet", label: "Code Snippet", icon: Code },
  { id: "case_study", label: "Case Study", icon: BookOpen },
  { id: "research_note", label: "Research Note", icon: FlaskConical },
  { id: "real_world_application", label: "Real-World Application", icon: Lightbulb },
  { id: "pdf_resource", label: "PDF Resource", icon: FileText },
];

const ResearchExpertDashboard = () => {
  const { user } = useAuth();
  const [insights, setInsights] = useState<ResearchInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [newInsight, setNewInsight] = useState({
    concept_id: "arrays",
    title: "",
    insight_type: "code_snippet",
    content: "",
    code_language: "python",
  });

  useEffect(() => {
    fetchInsights();
  }, [user]);

  const fetchInsights = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("research_insights")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setInsights(data || []);
    } catch (error) {
      console.error("Error fetching insights:", error);
    } finally {
      setIsLoading(false);
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

      setPdfUrl(publicUrl);
      setNewInsight(prev => ({
        ...prev,
        content: publicUrl,
        title: prev.title || file.name.replace(".pdf", ""),
      }));
      toast.success("PDF uploaded successfully");
    } catch (error) {
      console.error("Error uploading PDF:", error);
      toast.error("Failed to upload PDF");
    } finally {
      setIsUploading(false);
    }
  };

  const removePdf = () => {
    setPdfUrl(null);
    setNewInsight(prev => ({ ...prev, content: "" }));
  };

  const handleAddInsight = async () => {
    if (!user || !newInsight.title) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (newInsight.insight_type !== "pdf_resource" && !newInsight.content) {
      toast.error("Please add content for this insight");
      return;
    }

    if (newInsight.insight_type === "pdf_resource" && !pdfUrl) {
      toast.error("Please upload a PDF file");
      return;
    }

    try {
      const { error } = await supabase.from("research_insights").insert({
        user_id: user.id,
        concept_id: newInsight.concept_id,
        chapter_id: "arrays-stacks-queues",
        title: newInsight.title,
        insight_type: newInsight.insight_type,
        content: newInsight.insight_type === "pdf_resource" ? pdfUrl! : newInsight.content,
        code_language: newInsight.insight_type === "code_snippet" ? newInsight.code_language : null,
      });

      if (error) throw error;

      toast.success("Insight added successfully");
      setNewInsight({
        concept_id: "arrays",
        title: "",
        insight_type: "code_snippet",
        content: "",
        code_language: "python",
      });
      setPdfUrl(null);
      fetchInsights();
    } catch (error) {
      console.error("Error adding insight:", error);
      toast.error("Failed to add insight");
    }
  };

  const handleDeleteInsight = async (id: string) => {
    try {
      const { error } = await supabase
        .from("research_insights")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Insight deleted");
      setInsights(insights.filter((i) => i.id !== id));
    } catch (error) {
      console.error("Error deleting insight:", error);
      toast.error("Failed to delete insight");
    }
  };

  const getInsightIcon = (type: string) => {
    const found = insightTypes.find((t) => t.id === type);
    return found ? found.icon : FlaskConical;
  };

  return (
    <Tabs defaultValue="add" className="w-full">
      <TabsList className="mb-6">
        <TabsTrigger value="add" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Insight
        </TabsTrigger>
        <TabsTrigger value="manage" className="gap-2">
          <FlaskConical className="h-4 w-4" />
          My Insights ({insights.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="add" className="space-y-6">
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                <FlaskConical className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <CardTitle>Add Applied Insight</CardTitle>
                <CardDescription>
                  Share code snippets, case studies, PDFs, or research notes for Arrays, Stacks, and Queues
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Related Concept</Label>
                <Select
                  value={newInsight.concept_id}
                  onValueChange={(value) => setNewInsight({ ...newInsight, concept_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {concepts.map((concept) => (
                      <SelectItem key={concept.id} value={concept.id}>
                        {concept.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Insight Type</Label>
                <Select
                  value={newInsight.insight_type}
                  onValueChange={(value) => {
                    setNewInsight({ ...newInsight, insight_type: value, content: "" });
                    setPdfUrl(null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {insightTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        <div className="flex items-center gap-2">
                          <type.icon className="h-4 w-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={newInsight.title}
                onChange={(e) => setNewInsight({ ...newInsight, title: e.target.value })}
                placeholder="e.g., Stack usage in browser history implementation"
              />
            </div>

            {newInsight.insight_type === "code_snippet" && (
              <div className="space-y-2">
                <Label>Programming Language</Label>
                <Select
                  value={newInsight.code_language}
                  onValueChange={(value) => setNewInsight({ ...newInsight, code_language: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="python">Python</SelectItem>
                    <SelectItem value="java">Java</SelectItem>
                    <SelectItem value="c">C</SelectItem>
                    <SelectItem value="cpp">C++</SelectItem>
                    <SelectItem value="javascript">JavaScript</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {newInsight.insight_type === "pdf_resource" ? (
              <div className="space-y-2">
                <Label>Upload PDF</Label>
                {pdfUrl ? (
                  <div className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-muted/30">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-primary" />
                      <a
                        href={pdfUrl}
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
                      htmlFor="pdf-upload-research"
                      className="cursor-pointer text-primary hover:underline"
                    >
                      {isUploading ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Uploading...
                        </span>
                      ) : (
                        "Click to upload PDF (max 10MB)"
                      )}
                    </Label>
                    <Input
                      id="pdf-upload-research"
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={handlePdfUpload}
                      disabled={isUploading}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Content</Label>
                <Textarea
                  value={newInsight.content}
                  onChange={(e) => setNewInsight({ ...newInsight, content: e.target.value })}
                  placeholder={
                    newInsight.insight_type === "code_snippet"
                      ? "Paste your code here..."
                      : "Write your insight content here..."
                  }
                  className="min-h-[200px] font-mono"
                />
              </div>
            )}

            <Button onClick={handleAddInsight} className="w-full gap-2">
              <Save className="h-4 w-4" />
              Add Insight
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="manage" className="space-y-4">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          </div>
        ) : insights.length === 0 ? (
          <Card className="border-border/50 bg-card/50">
            <CardContent className="py-12 text-center">
              <FlaskConical className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-foreground mb-2">No insights yet</h3>
              <p className="text-muted-foreground">
                Add your first insight to help students understand real-world applications.
              </p>
            </CardContent>
          </Card>
        ) : (
          insights.map((insight) => {
            const Icon = getInsightIcon(insight.insight_type);
            const isPdf = insight.insight_type === "pdf_resource";
            return (
              <Card key={insight.id} className="border-border/50 bg-card/50">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-foreground">{insight.title}</h4>
                          <Badge variant="outline" className="text-xs">
                            {concepts.find((c) => c.id === insight.concept_id)?.title}
                          </Badge>
                        </div>
                        {isPdf ? (
                          <a
                            href={insight.content}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline flex items-center gap-1"
                          >
                            <FileText className="h-3 w-3" />
                            View PDF
                          </a>
                        ) : (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {insight.content.substring(0, 150)}...
                          </p>
                        )}
                        {insight.code_language && (
                          <Badge variant="secondary" className="mt-2 text-xs">
                            {insight.code_language}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteInsight(insight.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </TabsContent>
    </Tabs>
  );
};

export default ResearchExpertDashboard;