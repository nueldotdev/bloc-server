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
    const contextText = `The user is watching a video titled "${videoTitle}" at the timestamp ${Math.floor(timestamp)} seconds.`;

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

  if (!videoId || !videoTranscript) {
    res.status(400).json({ error: "Video ID and transcript are required" });
    return;
  }

  try {
    // Check database first
    const { data: existingTopics, error: dbError } = await supabase
      .from("video_topics")
      .select("topics")
      .eq("video_id", videoId)
      .maybeSingle(); // maybeSingle() is safer than .single()

    if (dbError) {
        console.warn("Database check for topics failed (table might not exist):", dbError.message);
    }

    if (existingTopics) {
      return res.json({ data: existingTopics.topics });
    }

    const prompt = `Based on the following video transcript, identify 5-8 key topics covered in the video. 
        Return the response as a JSON array of strings, where each string is a concise topic title.
        Example: ["Introduction to React", "State Management", "Hooks", "Conclusion"]

        Transcript:
        ${videoTranscript.slice(0, 20000)}`;

    const result = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const text = result.text;
    // console.log("text: => ", text);

    // Extract JSON from response
    const jsonMatch = text?.match(/\[.*\]/s);
    const topics = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    if (topics.length > 0) {
      // Save to database
      const { error: insertError } = await supabase.from("video_topics").insert([
        {
          video_id: videoId,
          topics: topics,
        },
      ]);

      if (insertError) {
          console.error("Error saving topics to database:", insertError.message);
      }
    }

    res.json({ data: topics });
  } catch (error) {
    console.error("Topics Generation Error:", error);
    res.status(500).json({ error: "Failed to generate topics", msg: error  });
  }
};
