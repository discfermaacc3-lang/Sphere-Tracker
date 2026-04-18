import mongoose from "mongoose";

mongoose.set("strictQuery", true);

let connectPromise: Promise<typeof mongoose> | null = null;

export const connectDB = async (): Promise<typeof mongoose> => {
  const uri = process.env["MONGODB_URI"];

  if (!uri) {
    throw new Error("MONGODB_URI must be set. Add it in Render → Environment.");
  }

  if (mongoose.connection.readyState === 1) return mongoose;
  if (connectPromise) return connectPromise;

  mongoose.connection.on("connected", () => console.log("[mongo] connected"));
  mongoose.connection.on("disconnected", () => console.warn("[mongo] disconnected"));
  mongoose.connection.on("reconnected", () => console.log("[mongo] reconnected"));
  mongoose.connection.on("error", (err) => console.error("[mongo] error:", err));

  connectPromise = mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10_000,
    socketTimeoutMS: 45_000,
    maxPoolSize: 10,
    minPoolSize: 1,
    retryWrites: true,
    autoIndex: true,
  });

  try {
    await connectPromise;
    return mongoose;
  } catch (err) {
    connectPromise = null;
    throw err;
  }
};

export const disconnectDB = async (): Promise<void> => {
  await mongoose.disconnect();
  connectPromise = null;
};

export { mongoose };
export * from "./schema";
