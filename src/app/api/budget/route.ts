import { streamObject, streamText } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';

export const runtime = 'edge';

export async function POST(req: Request) {
    const { goalAmount, campaignType } = await req.json();

    const result = await streamObject({
        model: google('gemini-2.5-flash'),
        // Define the exact JSON structure you want the AI to return
        schema: z.object({
            breakdown: z.array(
                z.object({
                    category: z.string().describe('The specific expense category'),
                    amount: z.number().describe('The allocated amount in INR'),
                    justification: z.string().describe('A brief, 1-sentence reason for this cost'),
                })
            ),
            totalImpact: z.string().describe('A powerful 1-sentence summary of what this money will achieve.'),
        }),
        prompt: `Create a realistic and transparent budget breakdown for a NayePankh Foundation ${campaignType} campaign aiming to raise ₹${goalAmount}.`,
    });

    return result.toTextStreamResponse();
}