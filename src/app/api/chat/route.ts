import { streamText, createTextStreamResponse, toTextStream, convertToModelMessages } from 'ai';
import { google } from '@ai-sdk/google';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

// Initialize Supabase Client for edge function
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = supabaseUrl && supabaseAnonKey 
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export async function POST(req: Request) {
    try {
        const { messages } = await req.json();

        if (!messages || !Array.isArray(messages)) {
            return new Response(JSON.stringify({ error: 'Messages array is required' }), { status: 400 });
        }

        // 1. RAG: Extract user query and query knowledge base
        const lastMsg = messages[messages.length - 1];
        let userQuery = '';
        if (lastMsg) {
            if (typeof lastMsg.content === 'string') {
                userQuery = lastMsg.content;
            } else if (Array.isArray(lastMsg.parts)) {
                userQuery = lastMsg.parts
                    .map((p: any) => p.text || '')
                    .join(' ');
            } else if (lastMsg.content && typeof lastMsg.content === 'object') {
                userQuery = JSON.stringify(lastMsg.content);
            }
        }

        let databaseContext = 'No direct knowledge base matches found.';

        if (supabase) {
            try {
                // Fetch the public knowledge base records
                const { data: kbData, error } = await supabase
                    .from('knowledge_base')
                    .select('category, question, answer');

                if (!error && kbData && kbData.length > 0) {
                    // Simple word overlap keyword matching for retrieval context
                    const words = userQuery
                        .toLowerCase()
                        .replace(/[^\w\s]/g, '')
                        .split(/\s+/)
                        .filter(w => w.length > 2); // ignore short words like 'a', 'to', 'is'

                    const matchingRows = kbData.filter(row => {
                        const textToSearch = `${row.category} ${row.question} ${row.answer}`.toLowerCase();
                        return words.some(word => textToSearch.includes(word));
                    });

                    // Use matched rows if found, else fallback to general guidelines (first 3 rows)
                    const selectedRows = matchingRows.length > 0 
                        ? matchingRows 
                        : kbData.slice(0, 3);

                    databaseContext = selectedRows
                        .map((row, idx) => `Reference ${idx + 1} (${row.category}):\nQ: ${row.question}\nA: ${row.answer}`)
                        .join('\n\n');
                }
            } catch (supabaseError) {
                console.error("Supabase KB query failed, falling back:", supabaseError);
            }
        }

        const systemPrompt = `You are PankhAI, a warm, professional, and knowledgeable AI assistant for NayePankh Foundation volunteers and coordinators.
NayePankh Foundation is a certified, non-profit NGO in India that drives grassroots social upliftment.

Your purpose is to assist volunteers with tasks such as:
1. Writing or refining pitches and outreach messages.
2. Explaining NayePankh's initiatives (Hunger Relief, Stray Animal Welfare, Sanitary Hygiene Kits).
3. Handling potential donor objections (e.g. tax exemptions under Section 80G/12A, financial transparency).
4. Explaining fundraising strategies for different channels like WhatsApp, LinkedIn, and Email.

THE FOLLOWING LOGS ARE DYNAMICALLY RETRIEVED FROM THE NGO KNOWLEDGE BASE DATABASE:
---
${databaseContext}
---

Guidelines:
- Incorporate details from the KNOWLEDGE BASE REFERENCE context above to verify facts (such as Section 80G tax exemptions, initiative focus details, registration).
- Keep your answers inspiring, actionable, and relatively concise.
- Use bolding, bullet points, and numbered lists where helpful to make instructions easy to read.
- Do not use generic placeholders (like [Name]). Use realistic examples or prompt the user for specific details.
- Remind users that donations are tax-deductible and 100% transparent.`;

        // Transform UI messages to Vercel AI SDK Core/Model schema
        const modelMessages = await convertToModelMessages(messages);

        // Vercel AI SDK standard edge stream text
        const result = await streamText({
            model: google('gemini-2.5-flash'),
            system: systemPrompt,
            messages: modelMessages,
            temperature: 0.7,
        });

        return createTextStreamResponse({
            stream: toTextStream({ stream: result.stream }),
        });
    } catch (error: any) {
        console.error("Chat API error:", error);
        return new Response(JSON.stringify({ error: error.message || 'Failed to process chat session' }), { status: 500 });
    }
}
