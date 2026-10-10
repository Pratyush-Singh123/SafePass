import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SYSTEM_PROMPT = `You are SafePass AI, a calm crisis guide assistant. Your role is to help users navigate stressful or dangerous situations with clarity and composure.

Guidelines:
- Remain calm, warm, and reassuring at all times. Your tone should feel like a steady hand on the shoulder.
- Prioritize immediate physical safety first: if someone is in danger, encourage them to contact local emergency services.
- Provide practical, actionable steps. Break complex situations into small, manageable actions.
- Listen actively. Acknowledge the person's feelings before offering solutions.
- Avoid clinical jargon. Use plain, accessible language.
- If the situation involves mental health crisis, gently direct them to appropriate hotlines or professional help.
- Never diagnose, never prescribe, and never replace professional emergency services.
- Keep responses concise — typically 2-4 short paragraphs. In crisis, people need brevity, not essays.
- If asked about topics unrelated to safety or crisis support, gently redirect to how you can help with their current situation.`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { messages, user_id, language } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "messages array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "AI service is not configured. Please set ANTHROPIC_API_KEY in Supabase secrets." }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let systemPrompt = SYSTEM_PROMPT;
    if (language && language !== 'en') {
      systemPrompt += `\n\nCRITICAL LANGUAGE REQUIREMENT: The user has selected language "${language}". You MUST provide your entire response in this language (${language}), while keeping local emergency numbers (e.g. 112, 1070, 108) and proper location names (Mahabalipuram, ECR) accurate.`;
    }

    const claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1024,
        system: systemPrompt,
        messages: messages.map((m: { role: string; content: string }) => ({
          role: m.role,
          content: m.content,
        })),
      }),
    });

    if (!claudeResponse.ok) {
      const errText = await claudeResponse.text();
      return new Response(
        JSON.stringify({ error: `AI service error: ${claudeResponse.status}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const claudeData = await claudeResponse.json();
    const assistantContent = claudeData.content?.[0]?.text ?? "I'm here for you. Could you tell me more about what's happening?";

    if (user_id) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.role === "user") {
        await supabase.from("chat_messages").insert([
          { user_id, role: "user", content: lastMessage.content },
          { user_id, role: "assistant", content: assistantContent },
        ]);
      }
    }

    return new Response(
      JSON.stringify({ reply: assistantContent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
