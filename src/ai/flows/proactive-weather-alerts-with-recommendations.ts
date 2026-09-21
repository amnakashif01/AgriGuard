// Define WeatherAlertsFlow here
'use server';

/**
 * @fileOverview A weather alerts AI agent that generates proactive weather alerts with tailored advice for farmers.
 *
 * - proactiveWeatherAlertsWithRecommendations - A function that handles the weather alerts process.
 * - WeatherAlertsInput - The input type for the proactiveWeatherAlertsWithRecommendations function.
 * - WeatherAlertsOutput - The return type for the proactiveWeatherAlertsWithRecommendations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const WeatherAlertsInputSchema = z.object({
  location: z
    .string()
    .describe('The location of the farmer.'),
  crops: z.array(z.string()).describe('The crops grown by the farmer.'),
  weatherConditions: z
    .string()
    .describe('The current weather conditions in the area.'),
});
export type WeatherAlertsInput = z.infer<typeof WeatherAlertsInputSchema>;

const WeatherAlertsOutputSchema = z.object({
  alert: z.string().describe('A weather alert message for the farmer.'),
  advice: z.string().describe('Tailored advice for the farmer based on the weather conditions and crops grown.'),
});
export type WeatherAlertsOutput = z.infer<typeof WeatherAlertsOutputSchema>;

export async function proactiveWeatherAlertsWithRecommendations(
  input: WeatherAlertsInput
): Promise<WeatherAlertsOutput> {
  return proactiveWeatherAlertsWithRecommendationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'weatherAlertsPrompt',
  input: {schema: WeatherAlertsInputSchema},
  output: {schema: WeatherAlertsOutputSchema},
  prompt: `You are an AI assistant providing weather alerts and advice to farmers.

  Location: {{location}}
  Crops: {{crops}}
  Weather Conditions: {{weatherConditions}}

  Generate a concise weather alert message and provide tailored advice based on the weather conditions and crops grown.
  Format the response as follows:
  {
    "alert": "Weather alert message",
    "advice": "Tailored advice for the farmer"
  }`,
});

// Simple in-memory cache to prevent duplicate LLM calls for the same conditions
const weatherAlertsCache = new Map<string, { output: WeatherAlertsOutput, timestamp: number }>();
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour cache

const proactiveWeatherAlertsWithRecommendationsFlow = ai.defineFlow(
  {
    name: 'proactiveWeatherAlertsWithRecommendationsFlow',
    inputSchema: WeatherAlertsInputSchema,
    outputSchema: WeatherAlertsOutputSchema,
  },
  async input => {
    // Generate a unique key based on location, crops, and weather
    const cacheKey = `${input.location}_${[...input.crops].sort().join(',')}_${input.weatherConditions}`.toLowerCase();
    
    // Check if we already generated advice for this exact scenario recently
    const cached = weatherAlertsCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      console.log(`Serving weather alert from cache for: ${cacheKey}`);
      return cached.output;
    }

    let lastError: any;
    const maxAttempts = 3;
    const baseDelayMs = 2000;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const {output} = await prompt(input);
        
        // Save to cache before returning
        weatherAlertsCache.set(cacheKey, { output: output!, timestamp: Date.now() });
        return output!;
      } catch (error: any) {
        lastError = error;
        
        // Quota and validation failures will not improve through retries.
        const message = String(error?.message || error);
        const code = error?.code || '';
        const isTransient = ['UND_ERR_CONNECT_TIMEOUT', 'ETIMEDOUT', 'ECONNRESET'].includes(code);
        if (!isTransient) throw error;

        if (attempt < maxAttempts - 1) {
          const backoff = baseDelayMs * Math.pow(2, attempt);
          console.warn(`Weather alert generation failed (attempt ${attempt + 1}/${maxAttempts}). Retrying in ${backoff}ms...`);
          await new Promise(resolve => setTimeout(resolve, backoff));
        }
      }
    }

    throw lastError;
  }
);
