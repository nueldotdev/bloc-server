import { getTranscript } from "../utils/transcripts";
import { routeController } from "../utils/types";



export const getTranscriptRoute = async (ctx: routeController) => {
    const { id } = ctx.req.params;
  if (!id) {
    return ctx.res.status(400).json({ error: "Video ID is required" });
  }

  try {
    const transcriptData = await getTranscript(id as string)
    if (transcriptData) {
      const fullText = transcriptData.map((t: any) => t.text).join(" ");
      return ctx.res.status(200).json({ data: { transcriptData, text: fullText } });
    } else {
      return ctx.res.status(400).json({ error: "Video ID is required" });
    }
  } catch (error) {
    console.error("Transcript Error:", error);
    return ctx.res.status(500).json({ error: "Failed to fetch transcript" });
  }
}