import { z } from "zod";
import { ai } from "@/ai/genkit";

// Image Processing Output Schema
export const ImageProcessingOutputSchema = z.object({
  processedImage: z.string().describe('Base64 encoded processed image'),
  metadata: z.object({
    originalSize: z.number(),
    processedSize: z.number(),
    compressionRatio: z.number(),
    dimensions: z.object({
      width: z.number(),
      height: z.number()
    }),
    format: z.string(),
    quality: z.number()
  }),
  embeddings: z.array(z.number()).describe('Image embeddings for vector search'),
  cropDetection: z.object({
    cropType: z.string(),
    confidence: z.number(),
    plantParts: z.array(z.string()),
    growthStage: z.string()
  }),
  imageAnalysis: z.object({
    healthIndicators: z.array(z.string()),
    visibleSymptoms: z.array(z.string()),
    environmentalFactors: z.array(z.string()),
    recommendations: z.array(z.string())
  })
});

export type ImageProcessingOutput = z.infer<typeof ImageProcessingOutputSchema>;

// Image Processing Flow
export const imageProcessingAgent = ai.defineFlow(
  {
    name: "imageProcessingAgent",
    inputSchema: z.object({
      imageData: z.string().describe('Base64 encoded image data'),
      farmerText: z.string().optional().describe('Farmer description of symptoms'),
      location: z.string().optional().describe('Farm location for context')
    }),
    outputSchema: ImageProcessingOutputSchema,
  },
  async (input) => {
    try {
      // Step 1: Image Preprocessing
      const processedImage = await preprocessImage(input.imageData);
      
      // Step 2-4: Generate comprehensive analysis in a single API call to save quota
      const analysisResult = await analyzeImageComplete(processedImage, input.farmerText);
      
      // Generate embeddings from the text description locally
      const embeddings = generateTextEmbeddings(analysisResult.description);
      
      // Step 5: Generate Metadata
      const metadata = await generateImageMetadata(input.imageData, processedImage);
      
      return {
        processedImage,
        metadata,
        embeddings,
        cropDetection: analysisResult.cropDetection,
        imageAnalysis: analysisResult.imageAnalysis
      };
    } catch (error) {
      console.error('Image processing error:', error);
      throw new Error(`Image processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
);

// Image Preprocessing Functions (simplified for server context)
async function preprocessImage(imageData: string): Promise<string> {
  // For server context, we'll return the image as-is
  // In production, you'd use a proper image processing library like Sharp
  return imageData;
}

async function analyzeImageComplete(imageData: string, farmerText?: string): Promise<{
  description: string;
  cropDetection: {
    cropType: string;
    confidence: number;
    plantParts: string[];
    growthStage: string;
  };
  imageAnalysis: {
    healthIndicators: string[];
    visibleSymptoms: string[];
    environmentalFactors: string[];
    recommendations: string[];
  };
}> {
  try {
    const prompt = ai.definePrompt({
      name: 'completeImageAnalysis',
      input: {schema: z.object({})},
      output: {
        schema: z.object({
          description: z.string(),
          cropDetection: z.object({
            cropType: z.string(),
            confidence: z.number(),
            plantParts: z.array(z.string()),
            growthStage: z.string()
          }),
          imageAnalysis: z.object({
            healthIndicators: z.array(z.string()),
            visibleSymptoms: z.array(z.string()),
            environmentalFactors: z.array(z.string()),
            recommendations: z.array(z.string())
          })
        })
      },
      prompt: `Analyze this agricultural image comprehensively and provide all requested information.
      
      1. Provide a detailed description focusing on crop type, health, symptoms, environment, and growth stage.
      2. Identify the crop type, your confidence (0-1), visible plant parts, and growth stage.
      3. Analyze plant health indicators, visible symptoms, environmental factors, and immediate recommendations.
      
      Farmer description: ${farmerText || 'No description provided'}
      
      Image: ${imageData}
      
      Respond with JSON.`
    });
    
    const {output} = await prompt({});
    return {
      description: output?.description || '',
      cropDetection: output?.cropDetection || {
        cropType: 'Unknown',
        confidence: 0.0,
        plantParts: [],
        growthStage: 'Unknown'
      },
      imageAnalysis: output?.imageAnalysis || {
        healthIndicators: [],
        visibleSymptoms: [],
        environmentalFactors: [],
        recommendations: []
      }
    };
  } catch (error) {
    console.error('Complete image analysis error:', error);
    return {
      description: '',
      cropDetection: { cropType: 'Unknown', confidence: 0, plantParts: [], growthStage: 'Unknown' },
      imageAnalysis: { healthIndicators: [], visibleSymptoms: [], environmentalFactors: [], recommendations: [] }
    };
  }
}

async function generateImageMetadata(originalData: string, processedData: string): Promise<{
  originalSize: number;
  processedSize: number;
  compressionRatio: number;
  dimensions: { width: number; height: number };
  format: string;
  quality: number;
}> {
  const originalSize = Math.round((originalData.length * 3) / 4);
  const processedSize = Math.round((processedData.length * 3) / 4);
  const compressionRatio = processedSize / originalSize;
  
  return {
    originalSize,
    processedSize,
    compressionRatio,
    dimensions: {
      width: 1024, // Default dimensions
      height: 768
    },
    format: 'JPEG',
    quality: 0.8
  };
}

// Simple text embedding function (in production, use proper embedding model)
function generateTextEmbeddings(text: string): number[] {
  // This is a simplified implementation
  // In production, use a proper embedding model like OpenAI's text-embedding-ada-002
  const words = text.toLowerCase().split(/\s+/);
  const embeddings = new Array(384).fill(0);
  
  // Simple word frequency-based embedding
  words.forEach(word => {
    const hash = word.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    const index = Math.abs(hash) % 384;
    embeddings[index] += 1;
  });
  
  // Normalize
  const magnitude = Math.sqrt(embeddings.reduce((sum, val) => sum + val * val, 0));
  return embeddings.map(val => val / magnitude);
}
