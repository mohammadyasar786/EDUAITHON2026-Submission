import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const nptelRequestSchema = z.object({
  conceptId: z.string().min(1).max(100),
  conceptTitle: z.string().min(1).max(200),
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
    const validationResult = nptelRequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ error: "Invalid input", details: validationResult.error.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { conceptId, conceptTitle } = validationResult.data;
    
    console.log(`Fetching NPTEL suggestion for user ${user.id}: ${conceptTitle} (${conceptId})`);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

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
            content: `You are an educational assistant that suggests NPTEL (National Programme on Technology Enhanced Learning) courses for learning computer science and engineering concepts.

Your task is to suggest ONE relevant NPTEL course or lecture that explains the given concept well.

Requirements for course selection:
- Must be from NPTEL (https://nptel.ac.in)
- Prefer courses from IITs (IIT Delhi, IIT Bombay, IIT Kharagpur, IIT Madras, etc.)
- Focus on undergraduate-level explanations
- Select courses that are concept-focused and have clear syllabus alignment
- Choose courses taught by renowned professors

Respond with a JSON object in this exact format:
{
  "title": "Course or lecture title",
  "courseUrl": "Full NPTEL course URL (e.g., https://nptel.ac.in/courses/106102064)",
  "instructor": "Professor name",
  "institution": "IIT/Institution name"
}

Only respond with the JSON object, no other text.`
          },
          {
            role: "user",
            content: `Suggest an NPTEL course for learning about: ${conceptTitle}

This is for a computer science/engineering student studying data structures and algorithms at the undergraduate level.`
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Failed to get NPTEL suggestion from AI");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    console.log("AI response:", content);

    // Parse the JSON response
    let lecture;
    try {
      // Clean up the response in case it has markdown code blocks
      const cleanedContent = content.replace(/```json\n?|\n?```/g, "").trim();
      lecture = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      // Return a fallback based on concept
      lecture = getFallbackLecture(conceptId, conceptTitle);
    }

    return new Response(
      JSON.stringify({ lecture }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in nptel-suggestion function:", error);
    return new Response(
      JSON.stringify({ 
        error: "An error occurred getting the suggestion",
        lecture: null 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function getFallbackLecture(conceptId: string, conceptTitle: string) {
  const fallbacks: Record<string, { title: string; courseUrl: string; instructor: string; institution: string }> = {
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

  return fallbacks[conceptId] || {
    title: `${conceptTitle} - NPTEL Course`,
    courseUrl: "https://nptel.ac.in/courses/106102064",
    instructor: "Prof. Naveen Garg",
    institution: "IIT Delhi"
  };
}
