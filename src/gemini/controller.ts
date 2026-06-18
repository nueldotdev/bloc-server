import { Response } from "express";
import { AuthRequest } from "../utils/auth";
import { getGeminiResponse, client } from "./gemini";
import { supabase } from "../utils/supabase";

export const handleChat = async (req: AuthRequest, res: Response) => {
  const {
    message,
    history,
    videoId,
    videoTranscript,
    timestamp,
    videoTitle,
    sessionId,
  } = req.body;
  const user = req.user;

  if (!user) {
    res.status(401).json({ error: "Authentication required for AI features" });
    return;
  }

  try {
    // Fetch user profile for language preference
    const { data: profile } = await supabase
      .from("profiles")
      .select("preferred_language")
      .eq("id", user.id)
      .single();
    
    const language = profile?.preferred_language || "English";
    const contextText = `The user is watching a video titled "${videoTitle}" at the timestamp ${Math.floor(timestamp)} seconds. 
    IMPORTANT: You must respond in ${language}.`;

    // Convert history format if needed (Watchpage sends {role, parts: [{text}]})
    const formattedHistory = (history || []).map((h: any) => ({
      role: h.role === "model" ? "model" : "user",
      content: h.parts?.[0]?.text || h.text || "",
    }));

    const response = await getGeminiResponse(
      `${contextText}\n\n${message}`,
      formattedHistory,
      videoTranscript,
    );

    // Save chat to Supabase
    const { error: chatError } = await supabase.from("chats").insert([
      {
        user_id: user.id,
        video_id: videoId,
        session_id: sessionId,
        role: "user",
        text: message,
        timestamp,
      },
      {
        user_id: user.id,
        video_id: videoId,
        session_id: sessionId,
        role: "ai",
        text: response,
        timestamp,
      },
    ]);

    if (chatError) {
      console.error("Error saving chat to Supabase:", chatError);
    }

    res.json({ text: response });
  } catch (error) {
    console.error("Gemini Error:", error);
    res.status(500).json({ error: "Failed to get AI response", msg: error });
  }
};

export const getHistory = async (req: AuthRequest, res: Response) => {
  const { videoId } = req.params;
  const { sessionId } = req.query;
  const user = req.user;

  if (!user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  let query = supabase
    .from("chats")
    .select("*")
    .eq("user_id", user.id)
    .eq("video_id", videoId);

  if (sessionId) {
    query = query.eq("session_id", sessionId);
  }

  const { data, error } = await query.order("created_at", { ascending: true });

  if (error) {
    res.status(500).json({ error: error.message, msg: error });
    return;
  }

  res.json({ data });
};

export const getTopics = async (req: AuthRequest, res: Response) => {
  const { videoId, videoTranscript } = req.body;
  const user = req.user;

  if (!videoId || !videoTranscript) {
    res.status(400).json({ error: "Video ID and transcript are required" });
    return;
  }

  try {
    // Fetch user profile for language preference
    const { data: profile } = await supabase
      .from("profiles")
      .select("preferred_language")
      .eq("id", user?.id)
      .single();
    
    const language = profile?.preferred_language || "English";

    // Check database for existing topics in this specific language
    const { data: cached, error: dbError } = await supabase
      .from("video_cache")
      .select("topics")
      .eq("video_id", videoId)
      .maybeSingle();

    if (dbError) {
      console.warn("Database check for topics failed:", dbError.message);
    }

    // topics is now a map: { "English": [...], "Spanish": [...] }
    if (cached?.topics && cached.topics[language]) {
      return res.json({ data: cached.topics[language] });
    }

    const prompt = `Based on the following video transcript, identify 5-8 key topics covered in the video. 
        IMPORTANT: All topics must be in ${language}.
        Return the response as a JSON array of strings, where each string is a concise topic title.
        Example: ["Introduction to React", "State Management", "Hooks", "Conclusion"]

        Transcript:
        ${videoTranscript.slice(0, 20000)}`;

    const result = await client.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const text = result.text;
    const jsonMatch = text?.match(/\[.*\]/s);
    const topicsList = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    if (topicsList.length > 0) {
      // Merge with existing topics map
      const currentTopics = cached?.topics || {};
      const updatedTopics = {
        ...currentTopics,
        [language]: topicsList
      };

      await supabase.from("video_cache").upsert({ 
        video_id: videoId, 
        topics: updatedTopics 
      });
    }

    res.json({ data: topicsList });
  } catch (error) {
    console.error("Topics Generation Error:", error);
    res.status(500).json({ error: "Failed to generate topics", msg: error });
  }
};

export const getFinalQuiz = async (req: AuthRequest, res: Response) => {
  const { videoId, videoTranscript, videoTitle } = req.body;
  const user = req.user;

  if (!videoId || !videoTranscript) {
    res.status(400).json({ error: "Video ID and transcript are required" });
    return;
  }

  try {
    // Fetch user profile for language preference
    const { data: profile } = await supabase
      .from("profiles")
      .select("preferred_language")
      .eq("id", user?.id)
      .single();
    
    const language = profile?.preferred_language || "English";

    const prompt = `Based on the following video titled "${videoTitle}", generate a comprehensive final quiz to test the user's understanding of the entire content.
        IMPORTANT: The question, options, and explanation must all be in ${language}.
        Generate 5 multiple-choice questions. 
        Each question must have:
        - The question text
        - 4 options (A, B, C, D)
        - The correct answer (the letter A, B, C, or D)
        - A brief explanation of why that answer is correct.

        Return the response as a JSON array of objects with the following structure:
        [
          {
            "id": 1,
            "question": "What is...?",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correctAnswer": "A",
            "explanation": "Because..."
          },
          ...
        ]

        Transcript:
        ${videoTranscript.slice(0, 25000)}`;

    const result = await client.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const text = result.text;
    const jsonMatch = text?.match(/\[.*\]/s);
    const quiz = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    res.json({ data: quiz });
  } catch (error) {
    console.error("Final Quiz Generation Error:", error);
    res.status(500).json({ error: "Failed to generate final quiz", msg: error });
  }
};

export const getDynamicSanityCheck = async (req: AuthRequest, res: Response) => {
  const { videoId, videoTranscript, videoTitle, timestamp } = req.body;
  const user = req.user;

  if (!videoId || !videoTranscript) {
    res.status(400).json({ error: "Video ID and transcript are required" });
    return;
  }

  try {
    // Fetch user profile for language preference
    const { data: profile } = await supabase
      .from("profiles")
      .select("preferred_language")
      .eq("id", user?.id)
      .single();
    
    const language = profile?.preferred_language || "English";

    // Improve context slicing: Get a chunk around the current timestamp
    // Assuming roughly 150 words (1000 chars) per minute of video
    const estimatedCharIndex = Math.floor((timestamp / 60) * 1000);
    const start = Math.max(0, estimatedCharIndex - 2000);
    const end = start + 15000;
    const transcriptChunk = videoTranscript.slice(start, end);

    const prompt = `Based on the following video titled "${videoTitle}", generate ONE multiple-choice question to check if the user is paying attention to the concepts discussed JUST BEFORE the timestamp ${Math.floor(timestamp / 60)}:${(timestamp % 60).toString().padStart(2, '0')}.
        
        IMPORTANT: The question, options, and explanation must all be in ${language}.

        The transcript below includes timestamp markers like [mm:ss]. 
        CRITICAL RULES:
        - ONLY ask about information provided BEFORE the ${Math.floor(timestamp / 60)}:${(timestamp % 60).toString().padStart(2, '0')} marker.
        - DO NOT mention any concepts that appear in the transcript AFTER the current timestamp.
        - The question should be specific, concise, and have 4 clear options.
        - Include the index of the correct answer (0-3).

        Return the response as a JSON object:
        {
          "question": "What was just explained regarding...?",
          "options": ["...", "...", "...", "..."],
          "correctIndex": 0,
          "explanation": "..."
        }

        Transcript Context (centered around user position):
        ${transcriptChunk}`;

    const result = await client.models.generateContent({
      model: "gemini-3-flash-preview",
      // model: "gemini-1.5-flash",/
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const text = result.text;
    const jsonMatch = text?.match(/\{.*\}/s);
    const question = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

    res.json({ data: question });
  } catch (error) {
    console.error("Dynamic Sanity Check Error:", error);
    res.status(500).json({ error: "Failed to generate sanity check", msg: error });
  }
};
