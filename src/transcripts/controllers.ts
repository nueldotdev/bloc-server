// import { getTranscript } from "../utils/transcripts";
// import { routeController } from "../utils/types";

// export const getTranscriptRoute = async (ctx: routeController) => {
//     const { id } = ctx.req.params;
//   if (!id) {
//     return ctx.res.status(400).json({ error: "Video ID is required" });
//   }

//   try {
//     const transcriptData = await getTranscript(id as string)
//     if (transcriptData) {
//       const fullText = transcriptData.map((t: any) => t.text).join(" ");
//       return ctx.res.status(200).json({ data: { transcriptData, text: fullText } });
//     } else {
//       return ctx.res.status(400).json({ error: "Video ID is required" });
//     }
//   } catch (error: any) {
//   console.error("Transcript Error:", error);
//   return ctx.res.status(500).json({
//     error: "Failed to fetch transcript",
//     msg: error?.message || String(error)
//   });
// }
// }
//
//
//
// src/transcripts/controllers.ts
import { Request, Response } from "express";
import { getTranscript, TranscriptResponse } from "../utils/transcripts";
import { routeController } from "../utils/types";
import { supabase } from "../utils/supabase";

export async function getTranscriptRoute(
  ctx: routeController,
): Promise<Response> {
  const { id } = ctx.req.params;

  if (!id) {
    return ctx.res
      .status(400)
      .json({ success: false, message: "Missing id parameter" });
  }

  try {
    // 1. Check Cache First
    const { data: cached } = await supabase
      .from('video_cache')
      .select('transcript, transcript_data')
      .eq('video_id', id)
      .maybeSingle();

    if (cached?.transcript_data || cached?.transcript) {
      console.log(`[Transcript Controller] Cache hit for ${id}`);
      
      // If we have timestamped data, use it. Otherwise, use the raw text.
      const transcriptData = cached.transcript_data || null;
      const text = cached.transcript || (Array.isArray(transcriptData) ? transcriptData.map((t: any) => t.text).join(" ") : "");

      return ctx.res.status(200).json({ 
        status: "success",
        data: { 
          transcriptData, 
          text 
        }, 
        cached: true 
      });
    }

    // 2. Fetch if not cached
    const result = await getTranscript(id as string);
    if (result && "error" in result) {
      return ctx.res.status(422).json({
        success: false,
        message:
          "We couldn't retrieve a transcript for this video. It might lack captions, or YouTube is blocking the server request.",
        reason: result.reason,
      });
    }

    const transcriptData = result as TranscriptResponse[];
    const fullText = transcriptData.map((t: any) => t.text).join(" ");

    // 3. Save to Cache
    // We try to save both the raw text (for search/legacy) and the JSON data (for timestamps)
    await supabase.from('video_cache').upsert({
      video_id: id,
      transcript: fullText,
      transcript_data: transcriptData
    });

    return ctx.res.status(200).json({ 
      status: "success",
      data: { 
        transcriptData, 
        text: fullText 
      }, 
      cached: false 
    });
  } catch (error: any) {
    console.error("Transcript Error:", error);
    return ctx.res.status(500).json({ error: "Server error during transcript fetch" });
  }
}

export async function syncTranscriptRoute(
  ctx: routeController,
): Promise<Response> {
  const { videoId, transcript, transcriptData, title } = ctx.req.body;

  if (!videoId || (!transcript && !transcriptData)) {
    return ctx.res.status(400).json({ error: "Video ID and transcript data are required" });
  }

  try {
    const fullText = transcript || (Array.isArray(transcriptData) ? transcriptData.map((t: any) => t.text).join(" ") : "");

    await supabase.from('video_cache').upsert({
      video_id: videoId,
      transcript: fullText,
      transcript_data: transcriptData || null,
      title: title
    });

    return ctx.res.status(200).json({ success: true });
  } catch (error: any) {
    console.error("Sync Error:", error);
    return ctx.res.status(500).json({ error: "Failed to sync transcript" });
  }
}

