import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import puppeteer from 'puppeteer';

const app = express();
const PORT = process.env.PORT || 4000;

// Security middleware
app.use(helmet());

// Rate limiting
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
}));

// CORS configuration
app.use(cors({
  origin: ['https://www.figma.com', 'http://localhost:4000'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser
app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'HTML to Figma Backend'
  });
});

// Main scraping endpoint
app.post('/scrape', async (req, res) => {
  const { url, viewport = { width: 1200, height: 800 }, timeout = 60000 } = req.body;
  const startTime = Date.now();

  console.log(`🔍 Scraping request for: ${url} (timeout: ${timeout}ms)`);

  if (!url || !isValidUrl(url)) {
    return res.status(400).json({
      error: 'Invalid URL provided',
      message: 'Please provide a valid HTTP or HTTPS URL'
    });
  }

  let browser;

  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ],
      timeout: Math.min(timeout, 120000)
    });

    const page = await browser.newPage();
    await page.setViewport(viewport);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(3000);

    const html = await page.content();
    const processingTime = Date.now() - startTime;

    res.json({
      success: true,
      html,
      timestamp: new Date().toISOString(),
      performance: { processingTime }
    });

  } catch (error) {
    console.error('❌ Scraping error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to scrape website',
      details: error.message
    });
  } finally {
    if (browser) await browser.close();
  }
});

// Utility function to validate URLs
function isValidUrl(string) {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    message: 'The requested endpoint does not exist'
  });
});

// Start server
app.listen(PORT, () => {
  console.log('===================================================');
  console.log(`🚀 HTML to Figma Backend Server is running ✅`);
  console.log(`📡 Listening on: http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔧 Scrape endpoint: POST http://localhost:${PORT}/scrape`);
  console.log('===================================================\n');

  // Quick self-check (just logs, no request)
  console.log('🧠 Server is ready and waiting for requests...\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  process.exit(0);
});
