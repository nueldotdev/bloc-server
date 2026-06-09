import { Router } from "express";
import { routeController } from "../utils/types";
import { getTranscriptRoute, syncTranscriptRoute } from "./controllers";
import { requireAuth } from "../utils/auth";

const transcriptRouter = Router();

transcriptRouter.get("/:id", async (req, res) => {
  const ctx: routeController = { req, res }
  await getTranscriptRoute(ctx)
});

transcriptRouter.post("/sync", requireAuth, async (req, res) => {
  const ctx: routeController = { req, res }
  await syncTranscriptRoute(ctx)
});

export default transcriptRouter;