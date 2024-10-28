import mongoose, { Connection } from "mongoose";

let cachedConnection: Connection | null = null;

export async function connectToMongoDB() {
  if (cachedConnection) {
    console.log("mongodb already connected");
    return cachedConnection;
  }
  try {
    const cnx = await mongoose.connect(process.env.MONGODB_URI!);
    cachedConnection = cnx.connection;
    console.log("mongodb connection established");
    return cachedConnection;
  } catch (error) {
    console.log(error);
    throw error;
  }
}