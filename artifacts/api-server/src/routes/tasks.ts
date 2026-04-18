import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import mongoose from "mongoose";
import { Task, InsertTaskSchema, UpdateTaskSchema } from "@workspace/db";

const router: IRouter = Router();

const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

const isValidId = (id: string): boolean => mongoose.isValidObjectId(id);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const done = typeof req.query["done"] === "string" ? req.query["done"] === "true" : undefined;
    const ownerId = typeof req.query["ownerId"] === "string" ? req.query["ownerId"] : undefined;
    const limit = Math.min(Number(req.query["limit"]) || 100, 500);
    const skip = Math.max(Number(req.query["skip"]) || 0, 0);

    const filter: Record<string, unknown> = {};
    if (done !== undefined) filter["done"] = done;
    if (ownerId) filter["ownerId"] = ownerId;

    const [items, total] = await Promise.all([
      Task.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Task.countDocuments(filter),
    ]);

    res.json({ items, total, limit, skip });
  }),
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ error: "Invalid id" });
    const task = await Task.findById(id).lean();
    if (!task) return res.status(404).json({ error: "Not found" });
    return res.json(task);
  }),
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const parsed = InsertTaskSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
    }
    const created = await Task.create(parsed.data);
    return res.status(201).json(created.toObject());
  }),
);

router.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ error: "Invalid id" });
    const parsed = UpdateTaskSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
    }
    const updated = await Task.findByIdAndUpdate(id, parsed.data, { new: true, runValidators: true }).lean();
    if (!updated) return res.status(404).json({ error: "Not found" });
    return res.json(updated);
  }),
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ error: "Invalid id" });
    const deleted = await Task.findByIdAndDelete(id).lean();
    if (!deleted) return res.status(404).json({ error: "Not found" });
    return res.json({ ok: true, id });
  }),
);

export default router;
