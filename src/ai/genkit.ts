import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

// --- API Key Rotation Interceptor ---
const originalFetch = globalThis.fetch;
let currentKeyIndex = 0;

// Helper to get all available keys from process.env (GEMINI_API_KEY, GEMINI_API_KEY_1, GEMINI_API_KEY_2, etc.)
function getAvailableApiKeys(): string[] {
  const keys: string[] = [];
  if (process.env.GEMINI_API_KEY) keys.push(process.env.GEMINI_API_KEY);
  // Look for GEMINI_API_KEY_1 to GEMINI_API_KEY_10 first (highest priority after base key)
  for (let i = 1; i <= 10; i++) {
    const key = process.env[`GEMINI_API_KEY_${i}`];
    if (key && !keys.includes(key)) {
      keys.push(key);
    }
  }

  // Fallbacks
  if (process.env.GOOGLE_GENAI_API_KEY && !keys.includes(process.env.GOOGLE_GENAI_API_KEY)) keys.push(process.env.GOOGLE_GENAI_API_KEY);
  if (process.env.GOOGLE_API_KEY && !keys.includes(process.env.GOOGLE_API_KEY)) keys.push(process.env.GOOGLE_API_KEY);
  
  return keys.length > 0 ? keys : ['fallback-key-required'];
}

// Pre-fetch the keys for initialization
const allApiKeys = getAvailableApiKeys();
let apiKeys: string[] | null = allApiKeys;

globalThis.fetch = async (url, options) => {
  // Only intercept calls to the Google Generative Language API
  if (typeof url === 'string' && url.includes('generativelanguage.googleapis.com')) {
    if (!apiKeys) apiKeys = getAvailableApiKeys();
    
    let attempts = 0;
    let lastResponse: Response | null = null;
    
    while (attempts < apiKeys.length) {
      const activeKey = apiKeys[currentKeyIndex];
      
      // Inject the current key into the headers safely
      const newHeaders = new Headers(options?.headers || {});
      newHeaders.set('x-goog-api-key', activeKey);
      
      const modifiedOptions = { 
        ...options, 
        headers: newHeaders 
      };

      try {
        const response = await originalFetch(url, modifiedOptions);
        lastResponse = response;
        
        // If quota exceeded (429) or key is invalid/unauthorized (400, 403), or Google is overloaded (500, 503, 504), switch to the next key (or just retry)
        if (response.status === 429 || response.status === 400 || response.status === 403 || response.status === 500 || response.status === 503 || response.status === 504) {
          console.warn(`[API Key Manager] Key at index ${currentKeyIndex} failed with status ${response.status}. Switching to next key...`);
          currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
          attempts++;
          // Add a small 500ms delay for 500/503/504 errors to prevent immediate spam
          if (response.status >= 500) await new Promise(r => setTimeout(r, 500));
          continue; // Retry the while loop with the next key
        }
        
        // For any other status, just return the response normally
        return response;
      } catch (error) {
        throw error;
      }
    }
    
    // If all keys failed with 429
    console.error(`[API Key Manager] All ${apiKeys.length} API keys have exhausted their quota!`);
    if (lastResponse) {
      return lastResponse;
    }
  }
  
  // For all other URLs, just pass through normally
  return originalFetch(url, options);
};
// -----------------------------------

export const ai = genkit({
  plugins: [googleAI({ apiKey: allApiKeys[0] })],
  model: 'googleai/gemini-3.5-flash-lite',
});
