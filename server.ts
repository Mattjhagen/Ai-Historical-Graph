import express from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === 'production';
const port = Number(process.env.PORT) || 3000;

const app = express();
app.use(express.json({ limit: '10mb' }));

// Initialize Google GenAI client
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey
  ? new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Health / status endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(apiKey),
    timestamp: new Date().toISOString(),
  });
});

// AI Assistant Endpoint for Graph & RNG Commands
app.post('/api/ai/interpret', async (req, res) => {
  try {
    const { message, currentDatasetSummary, currentRngConfig } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!ai) {
      return res.status(200).json({
        fallback: true,
        message: 'No GEMINI_API_KEY configured on server; using local intelligent parser.',
      });
    }

    const systemPrompt = `You are OmniGraph & RNG Assistant, an intelligent copilot that controls a data plotting and random number generator utility.
The user may ask you to:
1. Manipulate or query an uploaded historical graph (e.g. "show only the last 30 days", "show last 7 days", "filter values over 100", "switch to bar chart", "show moving average", "highlight peak", "reset zoom", "what was the average?").
2. Configure and generate random numbers (e.g. "give me 50 random integers between 10 and 100", "generate 20 floats from 0 to 1 with 3 decimals", "roll 10 six-sided dice", "50 unique lottery numbers between 1 and 49").
3. Answer statistical or analytical questions about their current data.

Context:
- Dataset info: ${JSON.stringify(currentDatasetSummary || 'No dataset loaded yet')}
- Current RNG Config: ${JSON.stringify(currentRngConfig || {})}

You must respond in valid JSON matching this schema:
{
  "reply": "Clear, friendly, concise markdown reply to the user explaining what action was performed or answering their question.",
  "action": {
    "type": "NONE" | "GRAPH_FILTER_DATE" | "GRAPH_RESET" | "GRAPH_SET_SERIES" | "GRAPH_SET_TYPE" | "GRAPH_TOGGLE_MA" | "RNG_GENERATE" | "LOAD_SAMPLE_DATA",
    "graphDateRange": { "preset": "last30d" | "last7d" | "last90d" | "last1y" | "all" | "custom", "startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD" },
    "graphSeries": "column_name",
    "graphChartType": "scatter" | "bar" | "area",
    "graphShowMovingAvg": true | false,
    "graphMovingAvgPeriod": 7 | 14 | 30 | 50,
    "rngParams": {
      "count": 50,
      "min": 10,
      "max": 100,
      "type": "integer" | "float",
      "decimals": 2,
      "unique": false,
      "distribution": "uniform" | "normal",
      "mean": 50,
      "stdDev": 10
    },
    "sampleDataset": "tech_stocks" | "daily_sales" | "sensor_temperature"
  }
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: message,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { reply: text, action: { type: 'NONE' } };
    }

    res.json(parsed);
  } catch (error: any) {
    console.error('Gemini error:', error);
    res.status(500).json({
      error: error.message || 'Failed to interpret command with Gemini',
      fallback: true,
    });
  }
});

async function startServer() {
  if (!isProduction) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${port}`);
  });
}

startServer();
