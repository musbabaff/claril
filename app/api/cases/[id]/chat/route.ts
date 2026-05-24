// app/api/cases/[id]/chat/route.ts
import { createClient } from '@/lib/supabase/server';
import { streamComplete } from '@/lib/ai/stream';
import { AIMessage } from '@/lib/ai/types';

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

    const { messages, lang = 'English' } = await request.json();

    if (!Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Invalid messages body' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 4. Construct high-fidelity context
    let contextStr = `CASE METADATA:
- Subject Entity Name: ${caseRecord.subject_name}
- Reference ID: ${caseRecord.case_reference || 'N/A'}
- Primary Value / Metric: ${caseRecord.primary_value !== undefined ? caseRecord.primary_value : 'N/A'}
- Description: ${caseRecord.description || 'N/A'}

EXTRACTED DOCUMENTS:
`;

    if (extractions && extractions.length > 0) {
      extractions.forEach((ext, i) => {
        contextStr += `\n[Doc #${i + 1}] Name: ${ext.documents?.original_filename || 'Unknown'} | Type: ${ext.documents?.document_type || 'Unknown'}\nExtracted Payload:\n${JSON.stringify(ext.structured_data, null, 2)}\n`;
      });
    } else {
      contextStr += `No documents extracted yet.\n`;
    }

    if (analysis) {
      contextStr += `\nLATEST MULTI-AGENT SYNTHESIZED ANALYSIS:
- Overall Case Score: ${analysis.overall_score || 'N/A'}
- Strategic Recommendation: ${analysis.recommendation || 'N/A'}
- Detail Findings Summary:\n${analysis.summary || 'N/A'}
`;
    }

    const systemPrompt = `You are Case Copilot, the premium, universal, model-agnostic assistant for the Claril document intelligence platform.
Your task is to answer user queries using the provided case data, extracted payloads, and agent verification reports.
Be objective, professional, and clear. Avoid guessing if something is not in the context.
You MUST respond in: ${lang}.

Here is the current case intelligence data:
${contextStr}
`;

    // Map messages payload to AIMessage format
    const formattedMessages: AIMessage[] = messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content || '',
    }));

    // Start SSE response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const completionStream = streamComplete({
            system: systemPrompt,
            messages: formattedMessages
          });

          for await (const chunk of completionStream) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`));
          }

          // Optionally insert chat logs in the DB if case_messages exists
          try {
            const lastUserMsg = messages[messages.length - 1]?.content;
            if (lastUserMsg) {
              await supabase.from('case_messages').insert({
                case_id: caseId,
                role: 'user',
                content: lastUserMsg
              });
            }
          } catch {
            // gracefully bypass if case_messages table is not migrated yet
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        } catch (streamErr: unknown) {
          console.error('Chat streaming error:', streamErr);
          const streamErrMsg = streamErr instanceof Error ? streamErr.message : String(streamErr);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: streamErrMsg })}\n\n`));
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (err: unknown) {
    console.error(err);
    const errMsg = err instanceof Error ? err.message : 'Chat API Error';
    return new Response(
      JSON.stringify({ error: errMsg }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
