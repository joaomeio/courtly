import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"

const resendApiKey = Deno.env.get('RESEND_API_KEY');

serve(async (req) => {
  try {
    // 1. Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 2. Calculate the time window (24 hours from now)
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowPlusOneHour = new Date(tomorrow.getTime() + 60 * 60 * 1000);

    // 3. Fetch lessons occurring tomorrow
    const { data: lessons, error } = await supabaseClient
      .from('lessons')
      .select('*, students(full_name, email)')
      .eq('status', 'Scheduled')
      .gte('start_time', tomorrow.toISOString())
      .lt('start_time', tomorrowPlusOneHour.toISOString()); // e.g., batch run every hour

    if (error) throw error;

    console.log(`Found ${lessons.length} lessons to send reminders for.`);

    // 4. Send emails using Resend
    for (const lesson of lessons) {
      if (!lesson.students?.email) continue;

      const lessonTime = new Date(lesson.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resendApiKey}`
        },
        body: JSON.stringify({
          from: 'ServeFlow Reminders <onboarding@resend.dev>',
          to: lesson.students.email,
          subject: 'Reminder: Upcoming Tennis Lesson',
          html: `
            <h2>Hi ${lesson.students.full_name.split(' ')[0]},</h2>
            <p>This is a quick reminder that you have a tennis lesson scheduled for tomorrow at ${lessonTime}.</p>
            <p>Please remember to cancel at least 24 hours in advance if you cannot make it to avoid late cancellation fees.</p>
            <p>See you on the court!</p>
            <br/>
            <p>- Your Coach</p>
          `
        })
      });

      if (!res.ok) {
        console.error(`Failed to send email to ${lesson.students.email}`, await res.text());
      }
    }

    return new Response(
      JSON.stringify({ message: `Successfully processed ${lessons.length} reminders.` }),
      { headers: { "Content-Type": "application/json" } },
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 400,
    })
  }
})
