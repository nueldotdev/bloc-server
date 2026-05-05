import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

// New SDK initialization pattern
export const client = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const SYSTEM_PROMPT = `You are a helpful AI study assistant integrated into "Bloc", a distraction-free YouTube learning platform.
Your goal is to help users understand the video they are currently watching.
You have access to the video context provided by the user.
Be concise, educational, and encouraging.
If the user asks about something specific in the video, try to relate it to the timestamp they are currently at.`;

export const getGeminiResponse = async (
  userMessage: string,
  history: { role: string; content: string }[], // New SDK uses 'content' instead of 'parts'
  videoTranscript?: string,
) => {
  // Using the latest gemini-3-flash-preview model
  const model = "gemini-3-flash-preview";

  let fullMessage = userMessage;
  if (videoTranscript) {
    fullMessage = `Video Transcript Context:\n${videoTranscript.slice(0, 30000)}\n\nUser Message: ${userMessage}`;
  }

  const result = await client.models.generateContent({
    model,
    contents: [
      ...history.map((h) => ({ role: h.role, parts: [{ text: h.content }] })),
      { role: "user", parts: [{ text: fullMessage }] },
    ],
    config: {
      systemInstruction: SYSTEM_PROMPT,
      maxOutputTokens: 1000,
    },
  });

  return result.text;
};
