import { Router } from "express";
import { routeController } from "../utils/types";
import { getTranscriptRoute } from "./controllers";

const transcriptRouter = Router();

transcriptRouter.get("/:id", async (req, res) => {
  const ctx: routeController = { req, res }
  await getTranscriptRoute(ctx)
});

export default transcriptRouter;