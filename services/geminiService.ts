import { GoogleGenAI, Type } from "@google/genai";
import { CatAnalysisResult } from "../types";

const GEMINI_API_KEY = process.env.API_KEY || '';

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

export const analyzeCatImage = async (base64Image: string): Promise<CatAnalysisResult> => {
  if (!GEMINI_API_KEY) {
    throw new Error("API Key is missing. Please configure process.env.API_KEY.");
  }

  // Remove data URL prefix if present (e.g., "data:image/jpeg;base64,")
  const cleanBase64 = base64Image.includes('base64,') 
    ? base64Image.split('base64,')[1] 
    : base64Image;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg', // Assuming JPEG for simplicity, though API handles others
              data: cleanBase64
            }
          },
          {
            text: `Analyze this image for a stray cat management system. 
            Identify the cat's visual characteristics.
            If no cat is clearly visible, provide best guess but note it in features.
            Provide output in Chinese (Simplified).`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            breed: { type: Type.STRING, description: "Guessed breed (e.g., Chinese Garden Cat, Orange Tabby)" },
            color: { type: Type.STRING, description: "Primary colors and pattern" },
            estimatedAge: { type: Type.STRING, description: "Estimated age (e.g., 'Adult', 'Kitten', '2 years')" },
            features: { type: Type.STRING, description: "Distinctive physical features (e.g., bobtail, tipped ear)" },
            possibleNameSuggestions: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "3 cute name suggestions based on appearance"
            },
            visualHealthAssessment: { type: Type.STRING, description: "Visual health check (e.g., 'Looks healthy', 'Dirty fur', 'Eye infection')" }
          },
          required: ["breed", "color", "estimatedAge", "features", "visualHealthAssessment"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    return JSON.parse(text) as CatAnalysisResult;

  } catch (error) {
    console.error("Gemini analysis failed:", error);
    throw error;
  }
};
