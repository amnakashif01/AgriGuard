'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { ProtectionPlan, ProtectionPlanPhase } from '@/lib/models';

const GenerateProtectionPlanInputSchema = z.object({
  crop: z.string().describe('The name of the crop (e.g., Cotton, Wheat, Rice, Sugarcane, Maize).'),
  disease: z.string().describe('The current or past disease/pest that affected the crop.'),
  language: z.string().optional().describe('The requested output language (e.g., english or urdu).'),
});

const ProtectionPlanPhaseSchema = z.object({
  week: z.number().describe('The week number (1 to 4).'),
  title: z.string().describe('The focus or title for this week.'),
  tasks: z.array(z.string()).describe('A list of tasks or preventive measures for the week.'),
});

const GenerateProtectionPlanOutputSchema = z.object({
  duration: z.string().describe('The duration of the plan, should be "1 Month".'),
  phases: z.array(ProtectionPlanPhaseSchema).describe('The weekly phases of the protection plan.'),
  recommendations: z.array(z.string()).describe('General recommendations for protecting the crop.'),
});

export async function generateProtectionPlan(
  input: z.infer<typeof GenerateProtectionPlanInputSchema>
): Promise<ProtectionPlan> {
  return generateProtectionPlanFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateProtectionPlanPrompt',
  input: {schema: GenerateProtectionPlanInputSchema},
  output: {schema: GenerateProtectionPlanOutputSchema},
  prompt: `You are an expert agricultural consultant specializing in Pakistani crops.
The user's crop ({{{crop}}}) was recently diagnosed with or needs protection from: {{{disease}}}.
They need a comprehensive 1-month (4 weeks) protection plan to ensure the crop recovers and remains healthy.

Language instruction:
Generate your ENTIRE final JSON output in the requested language: {{#if language}}{{{language}}}{{else}}english{{/if}}.
Keep JSON keys in English.

Requirements:
1. Provide a step-by-step 1-month plan broken down into 4 weekly phases.
2. Each week should have a specific focus (e.g., "Week 1: Immediate Action & Monitoring", "Week 2: Preventive Spraying").
3. Include specific tasks for each week relevant to the crop and the disease.
4. Provide general recommendations for overall crop health (e.g., watering, soil health).
5. Ensure the tone is supportive and professional.
6. The plan should be highly accurate and practical for a farmer.

Respond in JSON format according to the output schema.`, // prettier-ignore
});

const generateProtectionPlanFlow = ai.defineFlow(
  {
    name: 'generateProtectionPlanFlow',
    inputSchema: GenerateProtectionPlanInputSchema,
    outputSchema: GenerateProtectionPlanOutputSchema,
  },
  async input => {
    async function retry<T>(fn: () => Promise<T>, attempts = 2, delayMs = 500): Promise<T> {
      let lastErr: any;
      for (let i = 0; i < attempts; i++) {
        try {
          return await fn();
        } catch (err: any) {
          lastErr = err;
          const msg = err?.message || String(err);
          if (msg.includes('429 Too Many Requests') || msg.includes('Quota exceeded')) {
            throw new Error('Google AI Free Tier Rate Limit Reached. Please wait a minute before trying again.');
          }
          const code = err?.code || '';
          if (code && !['UND_ERR_CONNECT_TIMEOUT', 'ETIMEDOUT', 'ECONNRESET'].includes(code)) {
            throw err;
          }
          await new Promise(r => setTimeout(r, delayMs * Math.pow(2, i)));
        }
      }
      throw lastErr;
    }

    const { output } = await retry(
      () => prompt(input),
      2,
      500
    );
    return output as ProtectionPlan;
  }
);
