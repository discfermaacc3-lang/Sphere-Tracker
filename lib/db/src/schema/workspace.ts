import mongoose, { Schema, type Model } from "mongoose";

export type WorkspaceDoc = {
  _id: string;
  state: Record<string, unknown>;
  updatedAt: Date;
};

const workspaceSchema = new Schema<WorkspaceDoc>(
  {
    _id: { type: String, default: "default" },
    state: { type: Schema.Types.Mixed, default: {} },
    updatedAt: { type: Date, default: () => new Date() },
  },
  { versionKey: false, _id: false, minimize: false },
);

export const Workspace: Model<WorkspaceDoc> =
  (mongoose.models["Workspace"] as Model<WorkspaceDoc>) ||
  mongoose.model<WorkspaceDoc>("Workspace", workspaceSchema);
