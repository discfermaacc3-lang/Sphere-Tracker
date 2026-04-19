import {
  Router,
  type IRouter,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import express from "express";
import { Workspace } from "@workspace/db";

const router: IRouter = Router();

const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const doc = await Workspace.findById("default").lean();
    if (!doc) {
      res.json({ state: null, updatedAt: 0 });
      return;
    }
    const updatedAt = doc.updatedAt instanceof Date ? doc.updatedAt.getTime() : 0;
    res.json({ state: doc.state ?? null, updatedAt });
  }),
);

router.put(
  "/",
  express.json({ limit: "10mb" }),
  asyncHandler(async (req, res) => {
    const body = req.body as unknown;
    if (!body || typeof body !== "object") {
      res.status(400).json({ error: "Body must be a JSON object" });
      return;
    }
    const now = new Date();
    const doc = await Workspace.findByIdAndUpdate(
      "default",
      { state: body, updatedAt: now },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).lean();
    const updatedAt =
      doc?.updatedAt instanceof Date ? doc.updatedAt.getTime() : now.getTime();
    res.json({ ok: true, updatedAt });
  }),
);

export default router;
