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

// CORS configuration - Allow Figma plugin requests
app.use(cors({
    origin: true, // Allow all origins for development
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false
}));

// Body parser
app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
    console.log('🏥 Health check requested');
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
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox'
            ],
            timeout: 30000
        });

        const page = await browser.newPage();
        await page.setViewport(viewport);
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
        await page.waitForTimeout(3000);

        // Extract elements with their styles and positions
        const elements = await page.evaluate(() => {
            const extractedElements = [];
            let elementId = 0;

            function extractElement(element) {
                if (!element || element.nodeType !== Node.ELEMENT_NODE) return null;

                const rect = element.getBoundingClientRect();
                const styles = window.getComputedStyle(element);

                // Skip elements that are not visible or have no dimensions
                if (rect.width === 0 && rect.height === 0) return null;
                if (styles.display === 'none' || styles.visibility === 'hidden') return null;

                const elementData = {
                    id: `element-${elementId++}`,
                    tagName: element.tagName,
                    textContent: element.textContent ? element.textContent.trim() : '',
                    bounds: {
                        x: Math.round(rect.left),
                        y: Math.round(rect.top),
                        width: Math.round(rect.width),
                        height: Math.round(rect.height)
                    },
                    styles: {
                        backgroundColor: styles.backgroundColor,
                        color: styles.color,
                        fontSize: parseFloat(styles.fontSize) || 16,
                        fontFamily: styles.fontFamily,
                        fontWeight: styles.fontWeight,
                        fontStyle: styles.fontStyle,
                        lineHeight: styles.lineHeight,
                        textAlign: styles.textAlign,
                        textDecoration: styles.textDecoration,
                        textTransform: styles.textTransform,
                        letterSpacing: styles.letterSpacing,
                        borderRadius: styles.borderRadius,
                        border: styles.border,
                        boxShadow: styles.boxShadow,
                        opacity: parseFloat(styles.opacity) || 1,
                        backgroundImage: styles.backgroundImage,
                        backgroundSize: styles.backgroundSize,
                        backgroundPosition: styles.backgroundPosition,
                        backgroundRepeat: styles.backgroundRepeat
                    }
                };

                // Add src for images
                if (element.tagName === 'IMG' && element.src) {
                    elementData.src = element.src;
                }

                return elementData;
            }

            // Extract all visible elements
            const allElements = document.querySelectorAll('*');
            for (const element of allElements) {
                const extracted = extractElement(element);
                if (extracted) {
                    extractedElements.push(extracted);
                }
            }

            return extractedElements;
        });

        const title = await page.title();
        const processingTime = Date.now() - startTime;

        console.log(`✅ Extracted ${elements.length} elements in ${processingTime}ms`);

        res.json({
            success: true,
            data: {
                title,
                elements,
                viewport,
                url
            },
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
