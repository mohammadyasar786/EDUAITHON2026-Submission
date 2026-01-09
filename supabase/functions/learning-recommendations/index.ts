import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const recommendationsRequestSchema = z.object({
  progress: z.record(z.unknown()).optional().default({}),
  recentTopics: z.array(z.string().max(200)).max(20).optional().default([]),
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
    const validationResult = recommendationsRequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ error: "Invalid input", details: validationResult.error.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { progress, recentTopics } = validationResult.data;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(`Generating recommendations for user ${user.id}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are LearnFlow AI, an adaptive learning path generator for EduVerse.

Based on the student's progress data, generate personalized learning recommendations.

Return a JSON object with this structure:
{
  "recommendations": [
    {
      "type": "review" | "practice" | "advance",
      "title": "Short title",
      "reason": "Why this is recommended",
      "priority": "high" | "medium" | "low"
    }
  ],
  "nextTopic": "Suggested next topic to learn",
  "encouragement": "A motivational message for the student"
}

Keep recommendations practical and actionable. Maximum 3 recommendations.`
          },
          {
            role: "user",
            content: `Student progress: ${JSON.stringify(progress || {})}
Recent topics: ${JSON.stringify(recentTopics || [])}`
          }
        ],
      }),
    });

    if (!response.ok) {
      console.error("AI gateway error:", response.status);
      return new Response(JSON.stringify({ 
        recommendations: [
          { type: "practice", title: "Continue Learning", reason: "Keep up your momentum!", priority: "medium" }
        ],
        nextTopic: "Continue with your current module",
        encouragement: "Great progress! Keep going!"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    let result = data.choices?.[0]?.message?.content;
    
    // Parse JSON from response
    try {
      // Clean up markdown if present
      if (result.includes("```json")) {
        result = result.replace(/```json\n?/g, "").replace(/```\n?/g, "");
      }
      result = JSON.parse(result);
    } catch {
      result = {
        recommendations: [
          { type: "practice", title: "Continue Learning", reason: "Keep up your momentum!", priority: "medium" }
        ],
        nextTopic: "Continue with your current module",
        encouragement: "Great progress! Keep going!"
      };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Recommendations error:", error);
    return new Response(JSON.stringify({ 
      error: "An error occurred generating recommendations",
      recommendations: [],
      nextTopic: "",
      encouragement: "Keep learning!"
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
