import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schemas
const explanationSchema = z.object({
  type: z.literal("explanation"),
  conceptTitle: z.string().min(1).max(200),
  conceptContent: z.string().max(5000).optional(),
  learningStyle: z.enum(["visual", "analogy", "step-by-step", "formula-first"]).optional(),
  diagnosticScore: z.number().min(0).max(100).optional(),
  quizScore: z.number().min(0).max(100).optional(),
  timeSpent: z.number().min(0).optional(),
});

const practiceSchema = z.object({
  type: z.literal("practice"),
  conceptTitle: z.string().min(1).max(200),
  numQuestions: z.number().int().min(1).max(10).default(3),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
});

const whyStuckSchema = z.object({
  type: z.literal("why-stuck"),
  conceptTitle: z.string().min(1).max(200),
  question: z.string().max(1000),
  selectedAnswer: z.string().max(500),
  correctAnswer: z.string().max(500),
});

const adaptiveLearningSchema = z.discriminatedUnion("type", [
  explanationSchema,
  practiceSchema,
  whyStuckSchema,
]);

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
  if (req.method === "OPTIONS") {
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
    const validationResult = adaptiveLearningSchema.safeParse(body);
    
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ error: "Invalid input", details: validationResult.error.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const params = validationResult.data;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = "";
    let userPrompt = "";

    switch (params.type) {
      case "explanation": {
        const diagnosticScore = params.diagnosticScore ?? 50;
        const quizScore = params.quizScore ?? 50;
        const timeSpent = params.timeSpent ?? 0;
        const learningStyle = params.learningStyle ?? "step-by-step";

        systemPrompt = `You are an expert educational AI tutor. Generate a concept explanation adapted to the student's learning style and current level.

Learning Style Guidelines:
- visual: Use diagrams descriptions, flowcharts, and visual metaphors
- analogy: Use real-world analogies and relatable comparisons
- step-by-step: Break down into numbered sequential steps
- formula-first: Start with formal definitions and mathematical notation

Adapt complexity based on:
- Diagnostic score: ${diagnosticScore}% (lower = simpler explanations)
- Quiz score: ${quizScore}% (lower = more foundational)
- Time spent: ${timeSpent}s (higher = they may be struggling)

Keep explanations clear, encouraging, and at an undergraduate academic level.`;

        userPrompt = `Generate an explanation for "${params.conceptTitle}" using the ${learningStyle} learning style.

Base content: ${params.conceptContent || "No base content provided"}

Provide a comprehensive yet accessible explanation with:
1. Main concept explanation (adapted to learning style)
2. Key points to remember
3. A practical example or application`;
        break;
      }

      case "practice":
        systemPrompt = `You are an expert educational AI creating adaptive practice questions.
        
Generate ${params.numQuestions} multiple-choice questions for the concept "${params.conceptTitle}" at ${params.difficulty} difficulty level.

Difficulty guidelines:
- easy: Basic recall and understanding questions
- medium: Application and analysis questions
- hard: Synthesis and evaluation questions

Return a JSON array with this exact structure:
{
  "questions": [
    {
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "difficulty": "easy|medium|hard",
      "explanation": "Brief explanation of the correct answer"
    }
  ]
}`;

        userPrompt = `Generate ${params.numQuestions} ${params.difficulty} difficulty questions about ${params.conceptTitle}.
Return ONLY valid JSON matching the specified structure.`;
        break;

      case "why-stuck":
        systemPrompt = `You are a supportive educational AI helping students understand their mistakes.

Analyze the student's incorrect answer and:
1. Identify the likely misconception
2. Explain why the correct answer is right
3. Suggest a targeted micro-explanation

Be supportive and use academic language. Never make the student feel bad about their mistake.`;

        userPrompt = `Question: ${params.question}
Student's answer: ${params.selectedAnswer}
Correct answer: ${params.correctAnswer}
Topic: ${params.conceptTitle}

Return a JSON object with:
{
  "misconception": "Brief description of the likely misconception",
  "explanation": "Clear explanation of why the correct answer is right",
  "suggestion": "A targeted tip to help the student understand better"
}`;
        break;
    }

    console.log(`Processing ${params.type} request for user ${user.id}, concept: ${params.conceptTitle}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "API credits exhausted. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content received from AI");
    }

    console.log(`Successfully generated ${params.type} response`);

    // Parse response based on type
    let result;
    if (params.type === "explanation") {
      result = { explanation: content };
    } else {
      // Parse JSON responses
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("No JSON found in response");
        }
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        // Return fallback based on type
        if (params.type === "practice") {
          result = {
            questions: [
              {
                question: `What is a key concept of ${params.conceptTitle}?`,
                options: ["Option A", "Option B", "Option C", "Option D"],
                correctIndex: 1,
                difficulty: params.difficulty,
                explanation: "This is the fundamental concept."
              }
            ]
          };
        } else {
          result = {
            misconception: "Common confusion between concepts",
            explanation: "Review the core definition and properties.",
            suggestion: "Try re-reading the concept explanation."
          };
        }
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error in adaptive-learning function:", error);
    return new Response(
      JSON.stringify({ error: "An error occurred processing your request" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
