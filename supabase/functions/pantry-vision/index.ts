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
    const { image_base64 } = await req.json();
    
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error("GEMINI_API_KEY is not set in Edge Function secrets");
    }

    const payload = {
      contents: [{
        parts: [
          { text: "Identify the food ingredients in this image. Return a JSON array of strings containing the ingredient names, and nothing else. Example: [\"Tomatoes\", \"Onions\"]" },
          {
            inline_data: {
              mime_type: "image/jpeg",
              data: image_base64
            }
          }
        ]
      }],
      generationConfig: {
        temperature: 0.4,
      }
    };

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "Failed to fetch response from Gemini Vision");
    }

    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
    
    // Parse the JSON array from the response text
    let ingredients = [];
    try {
      // Gemini sometimes wraps JSON in markdown block like ```json ... ```
      const cleanedText = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
      ingredients = JSON.parse(cleanedText);
      if (!Array.isArray(ingredients)) ingredients = [];
    } catch (e) {
      console.error("Failed to parse ingredients from AI:", aiText);
    }
    
    // In a real app, we would query the database to find recipes matching these ingredients.
    const mockRecipes = [
      {
        id: 'mock-1',
        title: 'Simple Tomato Stew',
        image_url: 'https://images.unsplash.com/photo-1574484284002-952d92456975',
        kcal: 300,
        prep_time_mins: 15,
        cook_time_mins: 45
      }
    ];

    return new Response(
      JSON.stringify({ 
        ingredients: ingredients,
        recipes: mockRecipes
      }),
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
