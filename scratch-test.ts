import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

// Simple fetch interceptor for testing
const originalFetch = globalThis.fetch;
globalThis.fetch = async (url, options) => {
  console.log('Fetch called with URL:', url);
  if (options?.headers) {
    console.log('Headers:', options.headers);
  }
  return originalFetch(url, options);
};

const ai = genkit({
  plugins: [googleAI({ apiKey: 'dummy-key-1' })],
});

async function test() {
  try {
    await ai.generate({
      model: 'googleai/gemini-3.6-flash',
      prompt: 'Hello',
    });
  } catch (e: any) {
    console.log('Error expected:', e.message);
  }
}

test();
