import { streamText, createTextStreamResponse, toTextStream } from 'ai';
import { google } from '@ai-sdk/google';

export const runtime = 'edge';

export async function POST(req: Request) {
    try {
        const { message, imageBase64 } = await req.json();

        if (!imageBase64) {
            return new Response(JSON.stringify({ error: 'Image input is required' }), { status: 400 });
        }

        // Strip out the data URL metadata prefix if present to isolate raw base64 data strings
        const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

        const result = await streamText({
            model: google('gemini-2.5-flash'),
            system: `You are an on-field PR coordinator for NayePankh Foundation. 
Your objective is to review an uploaded image capturing actual volunteer operational activities on the ground, synthesize the visual context, and write a striking, high-converting call-to-action story. 
Focus entirely on localized community engagement. Keep the tone inspiring and urgent.`,
            messages: [
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: message || "Analyze this field work activity and provide a fundraising copy." },
                        { type: 'image', image: base64Data, mediaType: 'image/jpeg' }
                    ]
                }
            ],
            temperature: 0.4,
        });

        return createTextStreamResponse({
            stream: toTextStream({ stream: result.stream }),
        });
    } catch (error) {
        console.error("Multimodal error:", error);
        return new Response(JSON.stringify({ error: 'Failed to process visual assets' }), { status: 500 });
    }
}