export async function register() {
  console.log('🚀 Instrumentation starting...');
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('✅ Running in Node.js environment');
    const { connectToMongoDB } = await import('./lib/db');
    try {
      console.log('📡 Attempting to connect to MongoDB...');
      await connectToMongoDB();
      console.log('✨ MongoDB connected successfully through instrumentation');
    } catch (error) {
      console.error('❌ Failed to connect to MongoDB:', error);
    }
  } else {
    console.log('⚠️ Not in Node.js environment, skipping MongoDB connection');
  }
}

export const runtime = 'nodejs';
