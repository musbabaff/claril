// app/api/cases/parse-voice/route.ts
import { createClient } from '@/lib/supabase/server';
import { complete } from '@/lib/ai/complete';
import { AIMessage } from '@/lib/ai/types';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }), 
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { transcript, lang = 'English' } = await request.json();

    if (!transcript || !transcript.trim()) {
      return new Response(
        JSON.stringify({ error: 'Transcript is required' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const systemPrompt = `You are an expert NLP parser inside the Claril document intelligence platform.
Your task is to take a raw voice transcription of a user describing a new case, parse out the key attributes, and format them into a clean JSON structure.
You MUST output ONLY a valid JSON object matching the following structure:
{
  "subject_name": "<Parsed entity/person name. If not found, use a reasonable summary>",
  "primary_value": <Parsed numeric value or amount. Must be a pure number. If not found, output 0>,
  "description": "<Synthesized short description of the case in ${lang}>",
  "case_reference": "<Short uppercase alphanumeric reference ID, e.g. CL-XXXX>"
}
Ensure there is absolutely no other text, markdown wrapper, or formatting except this raw JSON.`;

    const messages: AIMessage[] = [
      {
        role: 'user',
        content: `Voice transcript: "${transcript}"`
      }
    ];

    const result = await complete({
      system: systemPrompt,
      messages,
      temperature: 0.1,
    });

    let parsed = {
      subject_name: '',
      primary_value: 0,
      description: '',
      case_reference: '',
    };

    // Robust JSON extraction
    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[0].trim());
      } catch (pErr) {
        console.error('Failed to parse voice intake JSON:', pErr);
      }
    } else {
      // Fallback regex parsers
      console.warn('AI did not return valid wrapped JSON, attempting manual parse of:', result.text);
    }

    return NextResponse.json(parsed);

  } catch (err: unknown) {
    console.error(err);
    const errMsg = err instanceof Error ? err.message : 'Voice parser failed';
    return new Response(
      JSON.stringify({ error: errMsg }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Helper utility since Next.js standard imports need NextRequest/NextResponse
import { NextResponse } from 'next/server';
