# AI Analysis Server

Dedicated server for AI-powered report analysis. Designed to run on Render/Railway with 50+ second timeout limits.

## Features

- **CLO Report Analysis**: Analyzes Course Learning Outcomes data
- **SO Report Analysis**: Analyzes Student Outcome performance data  
- **Gemini AI Integration**: Uses Google's Gemini 2.0 Flash for analysis
- **Express.js Server**: Fast, lightweight web server
- **CORS Enabled**: Ready for cross-origin requests
- **Health Checks**: Built-in health monitoring

## API Endpoints

### Health Check
```
GET /health
```
Returns server status and timestamp.

### AI Analysis
```
POST /analyze
Content-Type: application/json

{
  "slug": "so-report" | "clo-report",
  "data": { ... }
}
```

**Response:**
```json
{
  "success": true,
  "slug": "so-report",
  "result": {
    "centralTendency": "...",
    "distributionShape": "...",
    "spread": "...",
    "performanceInsight": "...",
    "performanceBenchmarking": "..."
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Setup

### Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your Google AI API key
   ```

3. **Start server:**
   ```bash
   npm start
   ```

### Deploy to Render

1. **Connect your GitHub repo to Render**

2. **Set environment variables in Render dashboard:**
   - `GOOGLE_GENERATIVE_AI_API_KEY`: Your Google AI API key

3. **Build settings:**
   - Build Command: `npm install`
   - Start Command: `npm start`

4. **Deploy and get your server URL**

### Deploy to Railway

1. **Connect your GitHub repo to Railway**

2. **Set environment variables:**
   - `GOOGLE_GENERATIVE_AI_API_KEY`: Your Google AI API key

3. **Railway will auto-detect and deploy**

## Usage in Main App

Update your main app to call the external AI server:

```typescript
// In your so-report-ai API route
const AI_SERVER_URL = process.env.AI_SERVER_URL || 'https://your-ai-server.onrender.com';

const aiResponse = await fetch(`${AI_SERVER_URL}/analyze`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    slug: 'so-report',
    data: soAnalysisData
  })
});

const aiResult = await aiResponse.json();
```

## Environment Variables

- `GOOGLE_GENERATIVE_AI_API_KEY` (required): Google AI API key
- `PORT` (optional): Server port, defaults to 3002

## Benefits

- ✅ **No Timeout Issues**: Render/Railway allow 50+ seconds
- ✅ **Dedicated Resources**: Separate server for AI processing
- ✅ **Scalable**: Can handle multiple concurrent requests
- ✅ **Reliable**: Health checks and error handling
- ✅ **Fast**: Optimized for AI analysis only

## Testing

Test the server locally:

```bash
# Health check
curl http://localhost:3002/health

# AI analysis
curl -X POST http://localhost:3002/analyze \
  -H "Content-Type: application/json" \
  -d '{"slug": "so-report", "data": {...}}'
```