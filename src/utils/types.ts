import { Request, Response } from "express";


export type routeController = {
  req: Request
  res: Response
}