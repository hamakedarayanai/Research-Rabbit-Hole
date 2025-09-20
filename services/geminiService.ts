import { GoogleGenAI, Type } from "@google/genai";
import type { ApiResponse } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    concepts: {
      type: Type.ARRAY,
      description: "List of key concepts or entities. Each concept should have a unique ID, a label, and a group number for categorization.",
      items: {
        type: Type.OBJECT,
        properties: {
          id: {
            type: Type.STRING,
            description: "A unique identifier for the concept, ideally a normalized, lowercase version of the label.",
          },
          label: {
            type: Type.STRING,
            description: "The name of the concept or entity.",
          },
          group: {
            type: Type.INTEGER,
            description: "A number to categorize the concept, starting from 1.",
          },
        },
        required: ["id", "label", "group"],
      },
    },
    relationships: {
      type: Type.ARRAY,
      description: "List of connections between concepts. The source and target must match concept IDs.",
      items: {
        type: Type.OBJECT,
        properties: {
          source: {
            type: Type.STRING,
            description: "The ID of the source concept.",
          },
          target: {
            type: Type.STRING,
            description: "The ID of the target concept.",
          },
          label: {
            type: Type.STRING,
            description: "A brief description of the relationship (e.g., 'influences', 'is a part of').",
          },
        },
        required: ["source", "target", "label"],
      },
    },
    relatedTopics: {
      type: Type.ARRAY,
      description: "A list of 3-5 related topics or questions for further exploration.",
      items: {
        type: Type.STRING,
      },
    },
  },
  required: ["concepts", "relationships", "relatedTopics"],
};

export const generateConceptMap = async (text: string): Promise<ApiResponse> => {
  try {
    const prompt = `
      Analyze the following text. Identify the key concepts/entities and their relationships. 
      Also, suggest 3-5 related topics for deeper exploration. 
      Format the entire output as a single, valid JSON object matching the provided schema. 
      Do not include any other text, explanations, or markdown formatting. Ensure all relationship 'source' and 'target' values exactly match one of the defined concept 'id's.
      The provided text is:
      ---
      ${text}
      ---
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const jsonString = response.text;
    const parsedData: ApiResponse = JSON.parse(jsonString);

    // Data validation and cleanup
    const validNodeIds = new Set(parsedData.concepts.map(c => c.id));
    parsedData.relationships = parsedData.relationships.filter(
      r => validNodeIds.has(r.source) && validNodeIds.has(r.target)
    );

    return parsedData;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to generate concept map. Please check the input and try again.");
  }
};

export const fetchArticleContent = async (url: string): Promise<string> => {
  try {
    const prompt = `Provide a comprehensive summary of the main article content found at the following URL. Extract the key arguments, concepts, and conclusions. URL: ${url}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{googleSearch: {}}],
      },
    });

    return response.text;

  } catch (error) {
    console.error("Error fetching article content from URL:", error);
    throw new Error("Failed to fetch and summarize the article. Please check the URL or try again.");
  }
};
