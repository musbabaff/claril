// app/api/cases/[id]/simulate/route.ts
import { createClient } from '@/lib/supabase/server';
import { complete } from '@/lib/ai/complete';
import { AIMessage } from '@/lib/ai/types';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const caseId = resolvedParams.id;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }), 
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 1. Fetch case and verify ownership
    const { data: caseRecord, error: caseErr } = await supabase
      .from('cases')
      .select('*')
      .eq('id', caseId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (caseErr || !caseRecord) {
      return new Response(
        JSON.stringify({ error: 'Case not found or unauthorized' }), 
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. Fetch completed extractions
    const { data: extractions } = await supabase
      .from('extractions')
      .select('*, documents(original_filename, document_type)')
      .eq('case_id', caseId)
      .eq('status', 'completed');

    // 3. Fetch latest finished analysis
    const { data: analysis } = await supabase
      .from('analyses')
      .select('*')
      .eq('case_id', caseId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const { adjustedValues, lang = 'English' } = await request.json();

    if (!adjustedValues || typeof adjustedValues !== 'object') {
      return new Response(
        JSON.stringify({ error: 'Invalid adjusted values payload' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 4. Construct context
    let contextStr = `ORIGINAL CASE METADATA:
- Subject Entity Name: ${caseRecord.subject_name}
- Reference ID: ${caseRecord.case_reference || 'N/A'}
- Primary Value / Metric: ${caseRecord.primary_value !== undefined ? caseRecord.primary_value : 'N/A'}

ORIGINAL DOCUMENT EXTRACTIONS:
`;

    if (extractions && extractions.length > 0) {
      extractions.forEach((ext, i) => {
        contextStr += `\n[Doc #${i + 1}] Name: ${ext.documents?.original_filename || 'Unknown'} | Type: ${ext.documents?.document_type || 'Unknown'}\nExtracted Payload:\n${JSON.stringify(ext.structured_data, null, 2)}\n`;
      });
    }

    if (analysis) {
      contextStr += `\nBASELINE PERFORMANCE (ORIGINAL):
- Overall Case Score: ${analysis.overall_score || 'N/A'}
- Baseline Recommendation: ${analysis.recommendation || 'N/A'}
`;
    }

    const systemPrompt = `You are the Counterfactual Simulator for the Claril document intelligence platform.
Your task is to re-evaluate the overall case risk score and final strategic recommendation given that certain numeric values from the document extractions have been altered by the user.

Here is the baseline intelligence context:
${contextStr}

The user has simulated changes to the following variables:
${JSON.stringify(adjustedValues, null, 2)}

Calculate a simulated overall score (0 to 100) reflecting this change. Produce a new simulated recommendation and a thorough, professional, step-by-step reasoning detailing the variance and outcome differences vs the original baseline.
Respond in: ${lang}.

At the end of your response, you MUST provide a final JSON block matching this EXACT shape for parsing:
\`\`\`json
{
  "simulated_score": <number between 0 and 100>,
  "simulated_recommendation": "<short text summarizing final simulated decision/action>",
  "simulated_reasoning": "<thorough explanation of how and why the score and outcome changed vs baseline>"
}
\`\`\`
Ensure the JSON block is perfectly formatted at the very end of your response.`;

    const messages: AIMessage[] = [
      {
        role: 'user',
        content: 'Run the scenario re-evaluation now.'
      }
    ];

    const result = await complete({
      system: systemPrompt,
      messages,
      temperature: 0.2,
    });

    let simulatedOut = {
      simulated_score: analysis?.overall_score || 80,
      simulated_recommendation: 'Simulation completed.',
      simulated_reasoning: 'No changes detected.',
    };

    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        simulatedOut = JSON.parse(jsonMatch[0].trim());
      } catch (pErr) {
        console.error('Failed to parse simulator JSON output:', pErr);
      }
    }

    return NextResponse.json(simulatedOut);

  } catch (err: unknown) {
    console.error(err);
    const errMsg = err instanceof Error ? err.message : 'Counterfactual API Error';
    return new Response(
      JSON.stringify({ error: errMsg }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
