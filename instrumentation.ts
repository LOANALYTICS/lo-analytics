import { connectToMongoDB } from './lib/db';

async function initMongoConnection() {
  try {
    await connectToMongoDB();
    console.log('MongoDB connected on server start');
  } catch (error) {
    console.error('Error connecting to MongoDB on startup:', error);
  }
}

// Call the function only when running in a Node.js environment
if (typeof window === 'undefined') {
  initMongoConnection();
}
