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

export async function getTranscriptRoute(
  ctx: routeController,
): Promise<Response> {
  // console.log("Request Params:", ctx.req.params)
  const { id } = ctx.req.params;
  // console.log("Type of ID: ", typeof id)

  if (!id) {
    return ctx.res
      .status(400)
      .json({ success: false, message: "Missing id parameter" });
  }

  const result = await getTranscript(id as string);
  if (result && "error" in result) {
    return ctx.res.status(422).json({
      success: false,
      message:
        "We couldn't retrieve a transcript for this video. It might lack captions, or YouTube is blocking the server request.",
      reason: result.reason,
    });
  }

  const fullText = result.map((t: any) => t.text).join(" ");
  return ctx.res.status(200).json({ data: { transcriptData: result, text: fullText }, status: "success" });
}
