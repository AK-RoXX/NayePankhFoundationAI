import { streamText, createTextStreamResponse, toTextStream } from 'ai';
import { google } from '@ai-sdk/google';

export const runtime = 'edge';

export async function POST(req: Request) {
    try {
        const { campaignType, donorProfile, platform } = await req.json();

        const systemPrompt = `You are an expert fundraising copywriter for NayePankh Foundation, a certified NGO dedicated to grassroots community upliftment.
Your goal is to generate a highly compelling, authentic, and emotionally resonant crowdfunding pitch.
Adjust your tone, length, and style strictly based on the target platform and donor profile provided.
Do not use generic placeholders. Incorporate clear calls to action pointing toward supporting NayePankh's active initiatives.`;

        const userPrompt = `Generate a crowdfunding pitch for the following configuration:
- Campaign Initiative: ${campaignType} (e.g., Feeding stray animals, distributing sanitary hygiene kits, or organizing hunger relief drives)
- Target Donor Audience: ${donorProfile} (e.g., a corporate professional, an empathetic family member, or a fellow university student)
- Distribution Channel: ${platform} (Ensure formatting matches perfectly. For WhatsApp, use clean line breaks and bold markup like *text*. For Email, provide a compelling subject line and professional signature block. For LinkedIn, include structured spacing and relevant social impact hashtags).`;

        // Swapped to Gemini Flash for rapid streaming and high context window
        const result = await streamText({
            model: google('gemini-2.5-flash'),
            system: systemPrompt,
            prompt: userPrompt,
            temperature: 0.7,
        });

        return createTextStreamResponse({
            stream: toTextStream({ stream: result.stream }),
        });
    } catch (error) {
        console.error("Generation error:", error);
        return new Response(JSON.stringify({ error: 'Failed to process generation request' }), { status: 500 });
    }
}