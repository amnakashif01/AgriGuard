'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const TranslateReportInputSchema = z.object({
  disease: z.string(),
  description: z.string(),
  affectedParts: z.array(z.string()),
  plan: z.any().optional(),
  protectionPlan: z.any().optional(),
  targetLanguage: z.string(),
});

const TranslateReportOutputSchema = z.object({
  disease: z.string(),
  description: z.string(),
  affectedParts: z.array(z.string()),
  plan: z.any().optional(),
  protectionPlan: z.any().optional(),
});

const prompt = ai.definePrompt({
  name: 'translateReportPrompt',
  input: { schema: TranslateReportInputSchema },
  output: { schema: TranslateReportOutputSchema },
  prompt: `You are an expert translator specializing in agriculture.
Translate the following crop diagnosis report data into {{targetLanguage}}.
Maintain the exact JSON structure. Do NOT change the keys, only translate the text values.

Original Data:
Disease: {{{disease}}}
Description: {{{description}}}
Affected Parts: {{json affectedParts}}

{{#if plan}}
Treatment Plan:
{{json plan}}
{{/if}}

{{#if protectionPlan}}
Protection Plan:
{{json protectionPlan}}
{{/if}}

Please output the translated fields as a JSON object matching the requested schema.`,
});

export const translateReportContent = ai.defineFlow(
  {
    name: 'translateReportFlow',
    inputSchema: TranslateReportInputSchema,
    outputSchema: TranslateReportOutputSchema,
  },
  async (input) => {
    // Basic retry wrapper
    let lastErr;
    for (let i = 0; i < 2; i++) {
        try {
            const { output } = await prompt(input);
            return output!;
        } catch (e: any) {
            lastErr = e;
            await new Promise(r => setTimeout(r, 1000));
        }
    }
    throw lastErr;
  }
);
