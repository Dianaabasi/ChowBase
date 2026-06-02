import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { messages, sapa_mode } = await req.json();
    
    // Simple placeholder for Gemini API integration
    // In production, we would use the GEMINI_API_KEY from Deno.env.get('GEMINI_API_KEY')
    // and make a real fetch call to the Google Generative AI endpoint
    
    const sapaContext = sapa_mode ? 
      "Keep recommendations extremely budget-friendly and use cheap local substitutes." : 
      "Provide high-quality Nigerian recipes without strict budget limits.";

    const systemPrompt = `You are a Nigerian Chef Assistant named ChowBase AI. 
      You speak with a warm, helpful tone and know everything about Nigerian cuisine. 
      ${sapaContext}`;

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error("GEMINI_API_KEY is not set in Edge Function secrets");
    }

    // Filter out the frontend welcome message (which has id: '0') 
    const filteredMessages = messages.filter((m: any) => m.id !== '0');
    
    // Gemini strictly requires alternating user/model roles. 
    // We must collapse consecutive messages of the same role.
    const collapsedMessages: any[] = [];
    let currentRole = null;
    let currentText = "";

    for (const m of filteredMessages) {
      const role = m.role === 'assistant' ? 'model' : 'user';
      if (role === currentRole) {
        currentText += "\n\n" + m.content;
      } else {
        if (currentRole) {
          collapsedMessages.push({ role: currentRole, parts: [{ text: currentText }] });
        }
        currentRole = role;
        currentText = m.content;
      }
    }
    if (currentRole) {
      collapsedMessages.push({ role: currentRole, parts: [{ text: currentText }] });
    }

    // Ensure the first message is from the user (Gemini requirement)
    if (collapsedMessages.length > 0 && collapsedMessages[0].role === 'model') {
      collapsedMessages.unshift({ role: 'user', parts: [{ text: 'Hello' }] });
    }

    const payload = {
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      contents: collapsedMessages,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 8192,
      }
    };

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "Failed to fetch response from Gemini");
    }

    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't process that.";

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
