import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    
    // We expect payload from a Supabase Postgres Trigger (Webhook)
    const { table, type, record } = payload;
    
    if (type !== 'INSERT' && type !== 'MANUAL') {
      return new Response(JSON.stringify({ message: "Ignored non-insert event" }), { headers: corsHeaders, status: 200 });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let pushMessages = [];

    if (payload.type === 'MANUAL') {
      const { target, title, body } = payload;
      if (!title || !body) {
        return new Response(JSON.stringify({ error: "Missing title or body" }), { headers: corsHeaders, status: 400 });
      }

      if (target === 'all') {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('expo_push_token')
          .eq('push_enabled', true)
          .not('expo_push_token', 'is', null);

        if (profiles && profiles.length > 0) {
          for (const p of profiles) {
            pushMessages.push({
              to: p.expo_push_token,
              sound: 'default',
              title,
              body,
              data: { url: 'chowbase://home' },
            });
          }
        }
      } else {
        // Target is specific user id
        const { data: profile } = await supabase
          .from('profiles')
          .select('expo_push_token, push_enabled')
          .eq('id', target)
          .single();

        if (profile && profile.push_enabled && profile.expo_push_token) {
          pushMessages.push({
            to: profile.expo_push_token,
            sound: 'default',
            title,
            body,
            data: { url: 'chowbase://home' },
          });
        }
      }
    } else if (table === 'notifications') {
      // 1. Single recipient for in-app notifications
      const recipientId = record.recipient_id;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('expo_push_token, push_enabled')
        .eq('id', recipientId)
        .single();
        
      if (!profile || !profile.push_enabled || !profile.expo_push_token) {
        return new Response(JSON.stringify({ message: "User has push notifications disabled or no token" }), { headers: corsHeaders, status: 200 });
      }

      // Format message based on notification type
      let title = "New Notification";
      let body = "You have a new activity on ChowBase.";
      
      if (record.type === 'follow') {
        title = "New Follower";
        body = "Someone started following you!";
      } else if (record.type === 'like') {
        title = "Recipe Liked ❤️";
        body = "Someone liked your recipe!";
      } else if (record.type === 'comment') {
        title = "New Comment 💬";
        body = "Someone commented on your recipe!";
      }

      pushMessages.push({
        to: profile.expo_push_token,
        sound: 'default',
        title,
        body,
        data: { url: 'chowbase://notifications' },
      });

    } else if (table === 'recipes') {
      // 2. Broadcast to all users for a new recipe
      const { data: profiles } = await supabase
        .from('profiles')
        .select('expo_push_token')
        .eq('push_enabled', true)
        .not('expo_push_token', 'is', null);

      if (!profiles || profiles.length === 0) {
        return new Response(JSON.stringify({ message: "No active push tokens found" }), { headers: corsHeaders, status: 200 });
      }

      const title = "New Recipe Alert! 🍲";
      const body = `A new recipe "${record.title}" was just published! Check it out.`;

      for (const p of profiles) {
        pushMessages.push({
          to: p.expo_push_token,
          sound: 'default',
          title,
          body,
          data: { url: `chowbase://recipe/${record.id}` },
        });
      }
    } else {
      return new Response(JSON.stringify({ message: "Ignored table" }), { headers: corsHeaders, status: 200 });
    }

    if (pushMessages.length === 0) {
      return new Response(JSON.stringify({ message: "No messages to send" }), { headers: corsHeaders, status: 200 });
    }

    // Send the push notifications via Expo API
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pushMessages),
    });

    const receipt = await response.json();

    return new Response(JSON.stringify({ success: true, receipt }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
