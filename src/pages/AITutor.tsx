import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import Navigation from "@/components/Navigation";
import { Brain, Send, Sparkles, BookOpen, Volume2, VolumeX, Square } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { AIVAButton } from "@/components/AIVA";
import { useLearningStreak } from "@/hooks/useLearningStreak";
interface Message {
  role: "user" | "assistant";
  content: string;
}
const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
const AITutor = () => {
  const {
    user,
    isLoading: authLoading
  } = useAuth();
  const navigate = useNavigate();
  const {
    speak,
    stop,
    isSpeaking
  } = useTextToSpeech();
  const {
    updateStreak
  } = useLearningStreak();
  const [messages, setMessages] = useState<Message[]>([{
    role: "assistant",
    content: "Hello! I'm your AI tutor. I'm here to help you learn anything you'd like. What would you like to study today?"
  }]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [speakingMessageIndex, setSpeakingMessageIndex] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const handleSpeak = (content: string, index: number) => {
    if (isSpeaking && speakingMessageIndex === index) {
      stop();
      setSpeakingMessageIndex(null);
    } else {
      stop();
      speak(content);
      setSpeakingMessageIndex(index);
    }
  };

  // Reset speaking state when speech ends
  useEffect(() => {
    if (!isSpeaking) {
      setSpeakingMessageIndex(null);
    }
  }, [isSpeaking]);
  useEffect(() => {
    if (!authLoading && !user) {
      toast.error("Please sign in to use the AI Tutor");
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Update streak when user starts a session
  useEffect(() => {
    if (user) {
      updateStreak();
    }
  }, [user, updateStreak]);
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);
  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;
    const userMessage = messageText.trim();
    setInput("");
    const userMsg: Message = {
      role: "user",
      content: userMessage
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    let assistantContent = "";
    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
        },
        body: JSON.stringify({
          messages: [...messages.slice(1), userMsg].map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      });
      if (!resp.ok || !resp.body) {
        const errorData = await resp.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to get response");
      }
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      // Add assistant message placeholder
      setMessages(prev => [...prev, {
        role: "assistant",
        content: ""
      }]);
      while (true) {
        const {
          done,
          value
        } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, {
          stream: true
        });
        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = {
                  role: "assistant",
                  content: assistantContent
                };
                return newMessages;
              });
            }
          } catch {
            // Incomplete JSON, wait for more data
          }
        }
      }

      // Save to database
      if (user) {
        await supabase.from("chat_messages").insert([{
          user_id: user.id,
          role: "user",
          content: userMessage
        }, {
          user_id: user.id,
          role: "assistant",
          content: assistantContent
        }]);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to get response");
      // Remove the empty assistant message on error
      setMessages(prev => prev.filter((_, i) => i !== prev.length - 1));
    } finally {
      setIsLoading(false);
    }
  };
  const handleSend = () => sendMessage(input);
  const handleQuickTopic = (topic: string) => {
    sendMessage(topic);
  };
  const quickTopics = [{
    icon: "🔬",
    label: "Science",
    topic: "Explain photosynthesis in simple terms"
  }, {
    icon: "📐",
    label: "Math",
    topic: "Help me understand quadratic equations"
  }, {
    icon: "🌍",
    label: "History",
    topic: "Tell me about ancient civilizations"
  }, {
    icon: "💻",
    label: "Coding",
    topic: "Teach me Python basics step by step"
  }];
  if (authLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>;
  }
  return <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="pt-20 pb-8 px-4 container mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary">
            <Brain className="h-4 w-4" />
            <span className="text-sm font-medium">AI Tutor Chat</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold">
            Your Personal{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-500 via-violet-500 to-fuchsia-500">
              AI Learning Assistant
            </span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Ask me anything! I can help explain concepts, solve problems, and guide your learning journey.
          </p>
        </div>

        {/* Quick Topics */}
        {messages.length === 1 && <div className="mb-6">
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {quickTopics.map((topic, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="h-auto py-3 px-4 justify-start text-left"
                  onClick={() => handleQuickTopic(topic.topic)}
                >
                  <span className="mr-2">{topic.icon}</span>
                  <span className="text-sm">{topic.label}</span>
                </Button>
              ))}
            </div>
          </div>}

        {/* Chat Interface */}
        <Card className="shadow-elevation border-2 rounded-3xl">
          <ScrollArea className="h-[500px] p-6" ref={scrollRef}>
            <div className="space-y-4">
              {messages.map((message, index) => <div key={index} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  {message.role === "assistant" && <div className="h-8 w-8 shrink-0 items-center justify-center gradient-primary flex flex-col rounded-xl">
                      <Sparkles className="h-4 w-4 text-primary-foreground" />
                    </div>}
                  <div className="flex flex-col gap-1 max-w-[80%]">
                    <div className={`rounded-2xl px-4 py-3 ${message.role === "user" ? "gradient-primary text-primary-foreground shadow-primary" : "bg-muted"}`}>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {message.content}
                      </p>
                    </div>
                    {message.role === "assistant" && message.content && <Button variant="ghost" size="sm" className="self-start h-7 px-2 text-xs text-muted-foreground hover:text-primary" onClick={() => handleSpeak(message.content, index)}>
                        {isSpeaking && speakingMessageIndex === index ? <>
                            <Square className="h-3 w-3 mr-1" />
                            Stop
                          </> : <>
                            <Volume2 className="h-3 w-3 mr-1" />
                            Listen
                          </>}
                      </Button>}
                  </div>
                  {message.role === "user" && <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </div>}
                </div>)}
              {isLoading && messages[messages.length - 1]?.role !== "assistant" && <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg gradient-primary">
                    <Sparkles className="h-4 w-4 text-primary-foreground animate-pulse" />
                  </div>
                  <div className="rounded-2xl px-4 py-3 bg-muted">
                    <div className="flex gap-1">
                      <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" />
                      <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:0.2s]" />
                      <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                </div>}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="border-t p-4 rounded-3xl">
            <form onSubmit={e => {
            e.preventDefault();
            handleSend();
          }} className="flex gap-2">
              <Input value={input} onChange={e => setInput(e.target.value)} placeholder="Ask me anything..." className="flex-1" disabled={isLoading} />
              <Button type="submit" size="icon" disabled={!input.trim() || isLoading} className="gradient-primary text-primary-foreground shadow-primary rounded-3xl">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </Card>
      </div>

      <AIVAButton context={{
      topic: "AI Tutor Session"
    }} learningStyle="step-by-step" />
    </div>;
};
export default AITutor;