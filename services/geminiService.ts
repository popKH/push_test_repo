import { GoogleGenAI } from '@google/genai';

const getApiKey = (): string => {
  const apiKey = 'AIzaSyAZQlHx4axCnrnVz8CPBG9t_a9V_ED0SVs';
  if (!apiKey) {
    throw new Error('API_KEY environment variable not set');
  }
  return apiKey;
};

export const scoreConversation = async (
  prompt: string,
  audioBase64: string,
  audioMimeType: string
): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const model = 'gemini-2.5-flash';

    const fullPrompt = `
      You are an expert conversation analyst. Your task is to analyze and score the provided audio conversation based on the user's specific instructions.
      Please provide a detailed analysis, address each point in the instructions, and give a final score or summary as requested.
      Format your response clearly using markdown for readability.

      ---
      USER'S SCORING INSTRUCTIONS:
      ${prompt}
      ---

      Begin your analysis below:
    `;

    const audioPart = {
      inlineData: {
        data: audioBase64,
        mimeType: audioMimeType,
      },
    };

    const textPart = { text: fullPrompt };

    const response = await ai.models.generateContent({
      model: model,
      contents: { parts: [textPart, audioPart] },
    });

    return response.text;
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    if (error instanceof Error) {
      throw new Error(`Gemini API Error: ${error.message}`);
    }
    throw new Error(
      'An unknown error occurred while communicating with the Gemini API.'
    );
  }
};
