import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const quizRequestSchema = z.object({
  concept: z.string().min(1).max(200),
  moduleName: z.string().min(1).max(200),
  numQuestions: z.number().int().min(1).max(10).default(5),
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
    const validationResult = quizRequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ error: "Invalid input", details: validationResult.error.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { concept, moduleName, numQuestions } = validationResult.data;
    
    console.log(`Generating quiz for user ${user.id}: ${concept}, module: ${moduleName}`);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an expert programming instructor creating accurate quiz questions. Generate exactly ${numQuestions} multiple-choice questions about "${concept}" in the context of "${moduleName}".

CRITICAL RULES:
1. Each question MUST have exactly ONE correct answer
2. The correctIndex MUST be the 0-based index of the correct answer in the options array
3. DOUBLE CHECK that correctIndex matches the actual correct answer's position (0 = first option, 1 = second, 2 = third, 3 = fourth)
4. The explanation MUST explain why the correct answer (the one at correctIndex) is right
5. Make wrong options plausible but clearly incorrect to experts

Each question must have:
- A clear, specific, factually accurate question
- Exactly 4 options where only ONE is correct
- correctIndex: the 0-based index (0, 1, 2, or 3) of the correct answer
- A brief explanation confirming why the answer at correctIndex is correct

Return ONLY valid JSON in this exact format:
{
  "questions": [
    {
      "question": "What is the time complexity of accessing an element by index in an array?",
      "options": ["O(1)", "O(n)", "O(log n)", "O(n²)"],
      "correctIndex": 0,
      "explanation": "Array index access is O(1) because elements are stored in contiguous memory, allowing direct address calculation."
    }
  ]
}

VERIFICATION: Before returning, verify each correctIndex by counting: options[0] is first, options[1] is second, etc.
Make questions progressively harder. Focus on practical understanding, not just memorization.`;

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
          { role: "user", content: `Create ${numQuestions} accurate quiz questions about "${concept}" for someone learning ${moduleName}. Remember: correctIndex must be 0-based (0=first option, 1=second, 2=third, 3=fourth). Verify each answer is correct before returning.` }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse the JSON from the response
    let questions;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        questions = parsed.questions;
        
        // Validate and fix correctIndex values
        questions = questions.map((q: any, idx: number) => {
          // Ensure correctIndex is a valid number between 0-3
          let correctIndex = typeof q.correctIndex === 'number' ? q.correctIndex : parseInt(q.correctIndex, 10);
          if (isNaN(correctIndex) || correctIndex < 0 || correctIndex > 3) {
            console.warn(`Question ${idx + 1} has invalid correctIndex: ${q.correctIndex}, defaulting to 0`);
            correctIndex = 0;
          }
          // Ensure options array has exactly 4 items
          const options = Array.isArray(q.options) && q.options.length === 4 
            ? q.options 
            : ["Option A", "Option B", "Option C", "Option D"];
          
          return {
            question: q.question || "Question not available",
            options,
            correctIndex,
            explanation: q.explanation || "No explanation available"
          };
        });
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse quiz response:", parseError);
      throw new Error("Failed to parse quiz questions");
    }

    console.log(`Successfully generated ${questions.length} questions`);

    return new Response(JSON.stringify({ questions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating quiz:", error);
    return new Response(
      JSON.stringify({ 
        error: "An error occurred generating the quiz",
        questions: null 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
