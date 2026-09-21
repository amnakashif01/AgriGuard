'use server';

/**
 * @fileOverview A crop disease diagnosis AI agent that uses an image and symptoms.
 *
 * - instantDiagnosisFromImageAndSymptoms - A function that handles the crop disease diagnosis process.
 * - InstantDiagnosisFromImageAndSymptomsInput - The input type for the instantDiagnosisFromImageAndSymptoms function.
 * - InstantDiagnosisFromImageAndSymptomsOutput - The return type for the instantDiagnosisFromImageAndSymptoms function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { knowledgeBase } from "@/lib/knowledge-base";
import { vectorSearch } from "@/lib/vector-search";

const InstantDiagnosisFromImageAndSymptomsInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      'A photo of a crop, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' // prettier-ignore
    ),
  symptoms: z.string().describe('The symptoms observed on the crop.'),
  crop: z.string().optional().describe('The crop type as identified by the user, if known.'),
  language: z.string().optional().describe('The requested output language (e.g., english or urdu).'),
});
export type InstantDiagnosisFromImageAndSymptomsInput = z.infer<
  typeof InstantDiagnosisFromImageAndSymptomsInputSchema
>;

const TreatmentStepSchema = z.object({
  stepNumber: z.number().describe('The step number in the treatment plan.'),
  title: z.string().describe('The title of the treatment step.'),
  description: z.string().describe('A detailed description of the treatment step.'),
  materials: z.array(z.string()).describe('A list of materials required for the step.'),
  cost: z.number().describe('The estimated cost of the materials in PKR.'),
  timing: z.string().describe('The timing of the treatment step (e.g., immediate, weekly).'),
  safetyNotes: z.string().describe('Important safety precautions for the step.'),
});

const TreatmentPlanSchema = z.object({
  steps: z.array(TreatmentStepSchema).describe('A list of treatment steps.'),
  totalCost: z.number().describe('The total estimated cost of the treatment plan in PKR.'),
  timeline: z.string().describe('The overall timeline for the treatment plan.'),
  preventionTips: z.array(z.string()).describe('A list of tips to prevent future occurrences of the disease.'),
});

const InstantDiagnosisFromImageAndSymptomsOutputSchema = z.object({
  crop: z.string().describe('The type of crop identified in the image (e.g., Cotton, Wheat, Rice, Sugarcane, Maize, etc.). If crop cannot be identified, use "Unknown Crop".'),
  disease: z.string().describe('The name of the disease or pest affecting the crop. Use "Healthy" ONLY if the plant shows absolutely no symptoms. If symptoms are present but disease cannot be identified, use "Unknown Disease" or "Unidentified Issue".'),
  confidence: z.number().describe('The confidence score (0-100) of the diagnosis.'),
  affectedParts: z.string().array().describe('The parts of the crop affected by the disease or pest. Use empty array [] for healthy plants.'),
  severity: z
    .enum(['None', 'Low', 'Medium', 'High'])
    .describe('The severity level of the disease or pest. Use "None" for healthy plants with no visible symptoms. Use Low/Medium/High only when disease is present.'),
  description: z.string().describe('A detailed description of the disease or pest and its symptoms. For healthy plants, describe why it is considered healthy. For unidentified diseases, describe the visible symptoms even if the specific disease cannot be named.'),
  plan: TreatmentPlanSchema.optional().describe('A detailed treatment plan. Only provide if a disease is identified.'),
});

export type InstantDiagnosisFromImageAndSymptomsOutput = z.infer<
  typeof InstantDiagnosisFromImageAndSymptomsOutputSchema
>;

export async function instantDiagnosisFromImageAndSymptoms(
  input: InstantDiagnosisFromImageAndSymptomsInput
): Promise<InstantDiagnosisFromImageAndSymptomsOutput> {
  return instantDiagnosisFromImageAndSymptomsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'instantDiagnosisFromImageAndSymptomsPrompt',
  input: {schema: InstantDiagnosisFromImageAndSymptomsInputSchema},
  output: {schema: InstantDiagnosisFromImageAndSymptomsOutputSchema},
  prompt: `You are an expert plant pathologist specializing in Pakistani crops (cotton, wheat, rice, sugarcane, maize).
Analyze the image and symptoms provided to diagnose any disease or pest affecting it.
{{#if crop}}The user has identified the crop as: {{{crop}}}. Validate this based on the image, or use this context to guide your diagnosis.{{/if}}

Image: {{media url=photoDataUri}}
Symptoms: {{{symptoms}}}

Language instruction:
Generate your ENTIRE final JSON output (specifically the description, disease, affectedParts, and the entire treatment plan) in the requested language: {{#if language}}{{{language}}}{{else}}english{{/if}}.
Keep JSON keys in English.

Knowledge Base Context:
{{knowledgeContext}}

Based on the image analysis and the knowledge base context above, identify:
1. Crop type (Cotton, Wheat, Rice, Sugarcane, Maize, or other common Pakistani crops). If unrecognizable, use "Unknown Crop".
2. Disease/pest name:
   - Use "Healthy" ONLY if plant shows absolutely NO visible symptoms (no spots, no yellowing, no wilting, etc.)
   - If symptoms ARE visible but disease cannot be identified: use "Unknown Disease" or "Unidentified Leaf Spotting" (describe what you see)
   - If you can match to knowledge base: use the specific disease name
3. Confidence score (0-100%) - consider both image analysis and symptom matching
4. Affected parts - from the knowledge base context. Use empty array [] for truly healthy plants.
5. Severity:
   - Use "None" ONLY for healthy plants with zero visible symptoms
   - Use "Low" for minor symptoms
   - Use "Medium" for moderate symptoms
   - Use "High" for severe symptoms
6. Description:
   - For healthy: explain why it's considered healthy (green leaves, no spots, vigorous growth)
   - For unknown disease: describe the visible symptoms in detail (yellowing, brown spots, size, location, etc.)
   - For identified disease: use knowledge base information
   - For non-plant images: politely state that the image does not appear to be a plant.
7. Treatment Plan (plan):
   - ONLY include if a disease or pest is identified. Do NOT include for "Healthy" or "Unknown Crop" / "Not a Crop".
   - Use locally available product names and brands for Pakistan.
   - Include cost estimates in Pakistani Rupees (PKR).

CRITICAL: If the image is CLEARLY NOT a plant or crop (e.g. a car, a person, a document), set Disease/pest name to "Not a Crop", Severity to "None", and skip diagnosis.
CRITICAL: If you see yellowing, brown spots, wilting, or any abnormal appearance → DO NOT say "Healthy". Instead say "Unknown Disease" with appropriate severity.

Respond in JSON format.`, // prettier-ignore
});

const instantDiagnosisFromImageAndSymptomsFlow = ai.defineFlow(
  {
    name: 'instantDiagnosisFromImageAndSymptomsFlow',
    inputSchema: InstantDiagnosisFromImageAndSymptomsInputSchema,
    outputSchema: InstantDiagnosisFromImageAndSymptomsOutputSchema,
  },
  async input => {
    // Retry/backoff helper for transient network errors
    async function retry<T>(fn: () => Promise<T>, attempts = 3, delayMs = 1000): Promise<T> {
      let lastErr: any;
      for (let i = 0; i < attempts; i++) {
        try {
          return await fn();
        } catch (err: any) {
          lastErr = err;
          const msg = err?.message || String(err);
          // Fail fast on Google AI Studio Free Tier Quota limits
          if (msg.includes('429 Too Many Requests') || msg.includes('Quota exceeded')) {
            throw new Error('Google AI Free Tier Rate Limit Reached. Please wait a minute before trying again.');
          }
          // For non-transient errors, rethrow immediately
          const code = err?.code || '';
          if (code && !['UND_ERR_CONNECT_TIMEOUT', 'ETIMEDOUT', 'ECONNRESET'].includes(code)) {
            throw err;
          }
          // exponential backoff
          const backoff = delayMs * Math.pow(2, i);
          await new Promise(r => setTimeout(r, backoff));
        }
      }
      throw lastErr;
    }

    try {
      // Step 1: Use RAG to find similar diseases based on symptoms
      const similarDiseases = await vectorSearch.searchSimilarDiseases(
        input.symptoms,
        input.crop !== 'Unknown Crop' ? input.crop : undefined, // Use provided crop for better RAG
        3, // top 3 similar diseases (reduced for speed)
        0.25 // similarity threshold (lowered for faster matching)
      );

      // Step 2: Prepare context from knowledge base
      const knowledgeContext = similarDiseases.map(disease => 
        `Disease: ${disease.disease}\nCrop: ${disease.crop}\nSymptoms: ${disease.symptoms.join(', ')}\nSeverity: ${disease.severity}\nConfidence: ${disease.confidence}`
      ).join('\n\n');

      // Step 3: Create enhanced prompt with knowledge context
      const enhancedPrompt = ai.definePrompt({
        name: 'ragEnhancedDiagnosisPrompt',
        input: {schema: InstantDiagnosisFromImageAndSymptomsInputSchema},
        output: {schema: InstantDiagnosisFromImageAndSymptomsOutputSchema},
        prompt: `You are an expert plant pathologist specializing in Pakistani crops (cotton, wheat, rice, sugarcane, maize).
Analyze the image and symptoms provided to diagnose any disease or pest affecting it.
{{#if crop}}The user has identified the crop as: {{{crop}}}. Validate this based on the image, or use this context to guide your diagnosis.{{/if}}

Image: {{media url=photoDataUri}}
Symptoms: {{{symptoms}}}

Language instruction:
Generate your ENTIRE final JSON output (specifically the description, disease, affectedParts, and the entire treatment plan) in the requested language: {{#if language}}{{{language}}}{{else}}english{{/if}}.
Keep JSON keys in English.

Knowledge Base Context:
${knowledgeContext}

Based on the image analysis and the knowledge base context above, identify:
1. Crop type (Cotton, Wheat, Rice, Sugarcane, Maize, or other common Pakistani crops). If unrecognizable, use "Unknown Crop".
2. Disease/pest name:
   - Use "Healthy" ONLY if plant shows absolutely NO visible symptoms (no spots, no yellowing, no wilting, etc.)
   - If symptoms ARE visible but disease cannot be identified: use "Unknown Disease" or "Unidentified Leaf Spotting" (describe what you see)
   - If you can match to knowledge base: use the specific disease name
3. Confidence score (0-100%) - consider both image analysis and symptom matching
4. Affected parts - from the knowledge base context. Use empty array [] for truly healthy plants.
5. Severity:
   - Use "None" ONLY for healthy plants with zero visible symptoms
   - Use "Low" for minor symptoms
   - Use "Medium" for moderate symptoms
   - Use "High" for severe symptoms
6. Description:
   - For healthy: explain why it's considered healthy (green leaves, no spots, vigorous growth)
   - For unknown disease: describe the visible symptoms in detail (yellowing, brown spots, size, location, etc.)
   - For identified disease: use knowledge base information
   - For non-plant images: politely state that the image does not appear to be a plant.
7. Treatment Plan (plan):
   - ONLY include if a disease or pest is identified. Do NOT include for "Healthy" or "Unknown Crop" / "Not a Crop".
   - Use locally available product names and brands for Pakistan.
   - Include cost estimates in Pakistani Rupees (PKR).

CRITICAL: If the image is CLEARLY NOT a plant or crop (e.g. a car, a person, a document), set Disease/pest name to "Not a Crop", Severity to "None", and skip diagnosis.
CRITICAL: If you see yellowing, brown spots, wilting, or any abnormal appearance → DO NOT say "Healthy". Instead say "Unknown Disease" with appropriate severity.

Respond in JSON format.`,
      });

      const { output } = await retry(() => enhancedPrompt(input), 2, 1500);
      return output!;
    } catch (error) {
      console.error('RAG-enhanced diagnosis error:', error);
      
      // Fallback to basic AI diagnosis if RAG fails
      const { output } = await retry(() => prompt(input), 2, 1500);
      return output!;
    }
  }
);
