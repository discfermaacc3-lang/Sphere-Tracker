import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { z } from "zod";

const taskSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: "", maxlength: 5000 },
    done: { type: Boolean, default: false, index: true },
    priority: { type: String, enum: ["low", "medium", "high"], default: "medium", index: true },
    dueDate: { type: Date, default: null },
    tags: { type: [String], default: [] },
    ownerId: { type: String, default: null, index: true },
  },
  { timestamps: true, versionKey: false },
);

taskSchema.index({ ownerId: 1, done: 1, createdAt: -1 });

export type TaskDoc = InferSchemaType<typeof taskSchema> & { _id: mongoose.Types.ObjectId };

export const Task: Model<TaskDoc> =
  (mongoose.models["Task"] as Model<TaskDoc>) ||
  mongoose.model<TaskDoc>("Task", taskSchema);

export const InsertTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  done: z.boolean().optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  dueDate: z.coerce.date().nullable().optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  ownerId: z.string().max(128).nullable().optional(),
});
export type InsertTask = z.infer<typeof InsertTaskSchema>;

export const UpdateTaskSchema = InsertTaskSchema.partial();
export type UpdateTask = z.infer<typeof UpdateTaskSchema>;
