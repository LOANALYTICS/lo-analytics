// lib/db.ts
import mongoose, { Connection } from 'mongoose';

let cachedConnection: Connection | null = null;

export async function connectToMongoDB() {
  if (cachedConnection) {
    return cachedConnection;
  }

  try {
    const connection = await mongoose.connect(process.env.MONGODB_URI!, {
      connectTimeoutMS: 20000, // Connection timeout
      socketTimeoutMS: 20000,  // Socket timeout
      serverSelectionTimeoutMS: 20000, // Server selection timeout
    });
    
    cachedConnection = connection.connection;
    
    // Handle connection events
    connection.connection.on('connected', () => {
      console.log('MongoDB connected successfully');
    });

    connection.connection.on('error', (err) => {
      console.log('MongoDB connection error:', err);
    });

    connection.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

    return cachedConnection;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}
