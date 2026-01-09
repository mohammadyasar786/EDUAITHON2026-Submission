import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().max(5000),
});

const contextSchema = z.object({
  concept: z.string().max(200).optional(),
  recentPerformance: z.string().max(200).optional(),
  focusLevel: z.string().max(50).optional(),
}).optional();

const performanceDataSchema = z.object({
  wrongAnswers: z.number().min(0).max(100).optional(),
  quizScore: z.number().min(0).max(100).optional(),
  attempts: z.number().min(0).max(100).optional(),
  timeSpent: z.number().min(0).optional(),
  isInactive: z.boolean().optional(),
  progressSpeed: z.enum(["fast", "normal", "slow"]).optional(),
}).optional();

const aivaChatSchema = z.object({
  message: z.string().min(1).max(2000),
  context: contextSchema,
  learningStyle: z.enum(["visual", "analogy", "step-by-step", "formula-first"]).optional(),
  conversationHistory: z.array(messageSchema).max(20).optional(),
  performanceData: performanceDataSchema,
});

async function authenticateRequest(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { user: null, error: "Missing or invalid authorization header" };
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await supabase.auth.getClaims(token);
  
  if (error || !data?.claims) {
    return { user: null, error: "Invalid or expired token" };
  }

  return { user: { id: data.claims.sub }, error: null };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the request
    const { user, error: authError } = await authenticateRequest(req);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: authError || "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate input
    const body = await req.json();
    const validationResult = aivaChatSchema.safeParse(body);
    
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ error: "Invalid input", details: validationResult.error.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { message, context, learningStyle, conversationHistory, performanceData } = validationResult.data;
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Analyze performance patterns for adaptive behavior
    const wrongAnswers = performanceData?.wrongAnswers || 0;
    const quizScore = performanceData?.quizScore || 0;
    const attempts = performanceData?.attempts || 0;
    const timeSpent = performanceData?.timeSpent || 0;
    const isInactive = performanceData?.isInactive || false;
    const progressSpeed = performanceData?.progressSpeed || "normal";

    // Determine adaptive response style
    let adaptiveStyle = "normal";
    let additionalGuidance = "";

    if (wrongAnswers >= 3 || (quizScore > 0 && quizScore < 40)) {
      adaptiveStyle = "simplified";
      additionalGuidance = `
IMPORTANT - ADAPTIVE MODE: The student is struggling (${wrongAnswers} wrong answers, ${quizScore}% score).
- Slow down your explanations significantly
- Use very simple analogies and everyday examples
- Break concepts into smaller, digestible pieces
- Be extra encouraging: "This is a tricky concept, but you're making progress"
- Ask clarifying questions to understand where they're stuck`;
    } else if (progressSpeed === "fast" || (quizScore >= 85 && attempts <= 1)) {
      adaptiveStyle = "concise";
      additionalGuidance = `
IMPORTANT - ADAPTIVE MODE: The student is progressing quickly (${quizScore}% score, ${attempts} attempts).
- Provide more concise explanations
- Skip basic introductions, get to the point
- Suggest application-based or challenge questions
- Encourage deeper exploration: "Want to try a more advanced scenario?"`;
    } else if (isInactive || timeSpent > 1800) {
      adaptiveStyle = "gentle-nudge";
      additionalGuidance = `
IMPORTANT - ADAPTIVE MODE: The student has been inactive or spending long time (${Math.round(timeSpent/60)} min).
- Start with a gentle check-in: "Still here? No pressure."
- Suggest a short break if they've been at it for a while
- Offer to simplify or approach from a different angle
- Do NOT pressure them: "Take your time. Learning isn't a race."`;
    }

    // Build contextual system prompt for AIVA - RESTRICTED TO Arrays, Stacks, and Queues
    const systemPrompt = `You are AIVA (AI Virtual Assistant), a calm, supportive, and academic learning companion for undergraduate engineering students.

YOUR ROLE:
- You are a contextual AI learning companion for the chapter: "Arrays, Stacks, and Queues"
- You ONLY help with topics related to Arrays, Stacks, and Queues
- You provide step-by-step guidance instead of direct answers
- You offer motivational and supportive messages

CHAPTER SCOPE - STRICT RESTRICTION:
You may ONLY discuss:
- Arrays: indexing, memory layout, operations (access, insert, delete), time complexity
- Stacks: LIFO principle, push, pop, peek operations, use cases (undo, recursion, expression evaluation)
- Queues: FIFO principle, enqueue, dequeue, use cases (scheduling, BFS, print spooling)
- Comparisons between these three data structures
- Real-world applications of these data structures

If asked about ANY other topic (trees, graphs, sorting, databases, etc.), politely redirect:
"I'm focused on helping you master Arrays, Stacks, and Queues right now. Let's stay on track!"

CURRENT LEARNING CONTEXT:
${context?.concept ? `- Current Concept: ${context.concept}` : '- Chapter: Arrays, Stacks, and Queues'}
${learningStyle ? `- Student's Learning Style: ${learningStyle}` : ''}
${context?.recentPerformance ? `- Recent Performance: ${context.recentPerformance}` : ''}
${context?.focusLevel ? `- Current Focus Level: ${context.focusLevel}` : ''}

PERFORMANCE DATA:
- Quiz Score: ${quizScore}%
- Attempts: ${attempts}
- Time Spent: ${Math.round(timeSpent/60)} minutes
- Wrong Answers This Session: ${wrongAnswers}
- Adaptive Mode: ${adaptiveStyle}
${additionalGuidance}

YOUR GUIDELINES:
1. Answer doubts ONLY related to the current chapter or concept if provided.
2. If the student asks something unrelated to learning, politely redirect them.
3. Use the student's learning style to explain concepts:
   - "step-by-step": Break down into numbered steps
   - "visual": Use analogies, diagrams descriptions, and visual metaphors
   - "analogy": Connect to familiar real-world scenarios
   - "formula-first": Lead with the formal definition, then explain

4. ADAPTIVE RESPONSES based on performance:
   - If struggling: Slow down, use simpler analogies, be extra encouraging
   - If progressing fast: Be concise, suggest challenges, encourage depth
   - If inactive: Gentle nudge without pressure, offer alternatives

5. When a student struggles (multiple wrong answers, low focus, or confusion):
   - Offer encouragement: "This concept often takes time. Want a simpler analogy?"
   - Suggest breaks if needed: "You've been at this for a while. A short break might help."
   - Break down problems: "Let's break this into smaller steps."
   - GENTLY MENTION NPTEL: If they continue struggling after 2+ wrong answers or ask for additional resources, you may say: "There's also a relevant NPTEL lecture from IIT if you'd like an academic video explanation. It's completely optional."
   - Do NOT force or repeatedly mention NPTEL. Only offer it once per struggling session as a gentle nudge.

6. NPTEL RESOURCE MENTIONS (IMPORTANT):
   - Only mention NPTEL when a student is clearly struggling (wrongAnswers >= 2 OR quizScore < 50)
   - Use gentle, non-pushy language: "If you'd like, there's an optional NPTEL lecture that covers this topic from an IIT professor."
   - Never insist on external resources. Learning progress does NOT depend on watching videos.
   - NPTEL is government-certified academic content - you can mention this if relevant.

7. NEVER:
   - Give final answers without explanation
   - Use jokes, memes, or overly playful language
   - Answer questions completely unrelated to academics
   - Pressure or rush the student
   - Force students to watch external videos

PERSONALITY:
- Calm and supportive
- Academic but approachable
- Encouraging without being exaggerated
- Professional yet warm

RESPONSE FORMAT:
- Keep responses concise (2-4 paragraphs max)
- Use bullet points for clarity when appropriate
- End with a helpful question or suggestion when relevant`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...(conversationHistory || []).slice(-10), // Keep last 10 messages for context
      { role: "user", content: message }
    ];

    console.log(`AIVA processing message for user ${user.id} with context:`, context);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: "I'm a bit overwhelmed right now. Please try again in a moment." 
        }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: "Service temporarily unavailable. Please try again later." 
        }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aivaResponse = data.choices?.[0]?.message?.content || 
      "I'm here to help! Could you tell me more about what you're working on?";

    console.log("AIVA response generated successfully");

    return new Response(JSON.stringify({ response: aivaResponse }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("AIVA chat error:", error);
    return new Response(JSON.stringify({ 
      error: "Something went wrong. Please try again." 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
