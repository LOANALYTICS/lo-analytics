import { connectToMongoDB } from "./lib/db";

export async function register() {
    await connectToMongoDB()
}